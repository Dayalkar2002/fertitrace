import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      oocyteSources: [
        {
          id: 'Fresh',
          label: 'Fresh cycle (FR)',
          description: "Patient's own stimulated cycle (Self Oocyte)",
        },
        {
          id: 'FET',
          label: 'Frozen Thaw Embryo Transfer (FET)',
          description: 'Thawing and transfer of cryopreserved embryos',
        },
        {
          id: 'FrozenOocytes',
          label: 'Frozen Oocyte (FZO)',
          description: "Patient's own retrieved oocytes cryopreserved",
        },
        {
          id: 'ThawOocytes',
          label: 'Thaw Oocyte (THO)',
          description: "Thawing of patient's cryopreserved oocytes",
        },
        {
          id: 'ER',
          label: 'Embryo Recipient (ER)',
          description: 'Patient will receive embryos from a donor couple',
        },
        {
          id: 'OD',
          label: 'Oocyte Donor (OD)',
          description: 'Donor will donate oocytes to recipient',
        },
        {
          id: 'OR',
          label: 'Oocyte Recipient (OR)',
          description: 'Patient will receive oocytes from a donor',
        },
      ],
      semenSources: [
        {
          id: 'husband_fresh',
          label: 'Husband - Fresh Sample',
          description: 'Fresh semen sample from husband/partner',
        },
        {
          id: 'husband_cryo',
          label: 'Husband - Cryopreserved (Frozen)',
          description: 'Frozen semen sample from husband/partner',
        },
        {
          id: 'donor_fresh',
          label: 'Donor - Fresh Sample',
          description: 'Fresh semen sample from donor',
        },
        {
          id: 'donor_cryo',
          label: 'Donor - Cryopreserved (Frozen)',
          description: 'Frozen semen sample from donor',
        },
        {
          id: 'surgical_fresh',
          label: 'Surgical Sperm (PESA / TESA / TESE)',
          description: 'Surgically retrieved sperm - fresh',
        },
        {
          id: 'surgical_frozen',
          label: 'Surgical Sperm - Frozen',
          description: 'Previous frozen surgical sperm sample',
        },
      ],
    },
  });
}
