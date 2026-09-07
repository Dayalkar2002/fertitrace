'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/auth-context';
import { fetchSatellites, searchPatients } from '@/lib/services/patients';
import { apiFetch } from '@/lib/api';
import type { Patient, Satellite } from '@/lib/types/patient';

import { useAppDispatch } from '@/store/hooks';
import {
  setSelectedPatient as setReduxPatient,
  setSelectedSatellite as setReduxSatellite,
  setSatellites as setReduxSatellites,
  setPatients as setReduxPatients,
  setPatientLoading as setReduxPatientLoading,
  setPatientError as setReduxPatientError,
  clearSelectedPatient as clearReduxPatient,
} from '@/store/slices/patientSlice';

interface PatientContextValue {
  selectedPatient: Patient | null;
  selectedSatellite: Satellite | null;
  satellites: Satellite[];
  patients: Patient[];
  loading: boolean;
  error: string | null;
  loadSatellites: () => Promise<void>;
  loadPatients: (satelliteId: number) => Promise<void>;
  selectSatellite: (satellite: Satellite) => void;
  selectPatient: (patient: Patient) => void;
  clearPatient: () => void;
}

const PatientContext = createContext<PatientContextValue | null>(null);

export function PatientProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const dispatch = useAppDispatch();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(null);
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSatellites = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await fetchSatellites(token);
      setSatellites(data);
      dispatch(setReduxSatellites(data));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load satellites.';
      setError(msg);
      dispatch(setReduxPatientError(msg));
    }
  }, [token, dispatch]);

  const loadPatients = useCallback(
    async (satelliteId: number) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      dispatch(setReduxPatientLoading(true));
      try {
        const data = await searchPatients(token, satelliteId, '');
        setPatients(data);
        dispatch(setReduxPatients(data));
      } catch (err) {
        setPatients([]);
        dispatch(setReduxPatients([]));
        const msg = err instanceof Error ? err.message : 'Failed to load patients.';
        setError(msg);
        dispatch(setReduxPatientError(msg));
      } finally {
        setLoading(false);
        dispatch(setReduxPatientLoading(false));
      }
    },
    [token, dispatch]
  );

  const selectSatellite = useCallback(
    (satellite: Satellite) => {
      setSelectedSatellite(satellite);
      dispatch(setReduxSatellite(satellite));
    },
    [dispatch]
  );

  const selectPatient = useCallback(
    (patient: Patient) => {
      const fullPatient: Patient = {
        ...patient,
        satelliteId: patient.satelliteId || selectedSatellite?.id || 0,
      };
      setSelectedPatient(fullPatient);
      dispatch(setReduxPatient(fullPatient));

      if (patient.id) {
        apiFetch<{ success: boolean; data: Record<string, unknown> }>(
          `/masters/patient/${patient.id}`,
          {},
          token
        )
          .then((res) => {
            if (res && res.data) {
              const d = res.data;
              let calcAge = fullPatient.age;
              if ((!calcAge || calcAge === 0) && d.dob) {
                const birthYear = new Date(String(d.dob)).getFullYear();
                if (birthYear > 1900) {
                  calcAge = new Date().getFullYear() - birthYear;
                }
              }
              const enriched: Patient = {
                ...fullPatient,
                uhid: String(d.refNo || fullPatient.uhid || `PT-00${patient.id}`),
                partner: String(d.husbandName || fullPatient.partner || ''),
                mobile: String(d.mobile || d.phone || fullPatient.mobile || ''),
                phone: String(d.phone || d.mobile || fullPatient.phone || ''),
                age: Number(calcAge || d.age || fullPatient.age || 0),
                aadhar: String(d.aadhar || fullPatient.aadhar || ''),
                category: String(d.category || fullPatient.category || ''),
              };
              setSelectedPatient(enriched);
              dispatch(setReduxPatient(enriched));
            }
          })
          .catch(() => {});
      }
    },
    [selectedSatellite, token, dispatch]
  );

  const clearPatient = useCallback(() => {
    setSelectedPatient(null);
    dispatch(clearReduxPatient());
  }, [dispatch]);

  const value = useMemo(
    () => ({
      selectedPatient,
      selectedSatellite,
      satellites,
      patients,
      loading,
      error,
      loadSatellites,
      loadPatients,
      selectSatellite,
      selectPatient,
      clearPatient,
    }),
    [
      selectedPatient,
      selectedSatellite,
      satellites,
      patients,
      loading,
      error,
      loadSatellites,
      loadPatients,
      selectSatellite,
      selectPatient,
      clearPatient,
    ]
  );

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) {
    throw new Error('usePatient must be used within PatientProvider');
  }
  return ctx;
}
