export interface DoctorInfo {
  id: string;
  name: string;
  title: string;
  subTitle?: string;
  regNo: string;
  specialty?: string;
}

export interface ClinicSettings {
  logoUrl?: string;
  clinicNameHi: string;
  clinicNameEn: string;
  doctors: DoctorInfo[];
  address: string;
  phone: string;
  openingHours: string;
  closedDay: string;
  headerBgColor: string;
  headerTextColor: string;
  pharmacyInfo: string;
  templateVariant?: 'a4' | 'dermatology' | 'general';
  customFrequencies?: string[];
  sections: {
    showPastHistory: boolean;
    showDrugHistory: boolean;
    showInvestigations: boolean;
    showCounselling: boolean;
    showWarnings: boolean;
    showFollowUp: boolean;
    showSignature: boolean;
  };
}

export const defaultClinicSettings: ClinicSettings = {
  clinicNameHi: "शिनगारे",
  clinicNameEn: "स्किन & कॉस्मेटीक क्लिनिक",
  doctors: [
    {
      id: "doc_1",
      name: "डॉ. प्रमोद सुरेश शिनगारे",
      title: "MD (Ayu) - D.Dermatology (Ay.)",
      subTitle: "(MUHS)",
      regNo: "Reg. No. I-87218-A",
      specialty: "त्वचारोग व सौंदर्य विशेष तज्ज्ञ",
    },
    {
      id: "doc_2",
      name: "डॉ. प्रियांका प्रमोद शिनगारे",
      title: "BHMS, FCHD, CCHC, CCMP (MUHS)",
      subTitle: "(Consultant Homeopathy Dermatologist & Cosmetologist)",
      regNo: "Reg. No. 73338",
      specialty: "त्वचारोग तज्ज्ञ",
    },
  ],
  address: "एस.टी. स्टँड जवळ, राजाराम चित्र मंदिर समोर, कल्याणी बझार वरती गाळा नं. ६, पेठ वडगाव",
  phone: "7249727104 / 9657727104",
  openingHours: "सकाळी १० ते सायं. ६ पर्यंत",
  closedDay: "दर रविवारी बंद राहिल.",
  headerBgColor: "#7CB342", // Clinic Brand Green
  headerTextColor: "#ffffff",
  pharmacyInfo: "वैद्यकीय सल्ल्यानुसार औषधे बदलू नयेत. औषधे बालकांच्या संपर्कापासून दूर ठेवावीत.",
  templateVariant: "a4",
  customFrequencies: [],
  sections: {
    showPastHistory: true,
    showDrugHistory: true,
    showInvestigations: true,
    showCounselling: true,
    showWarnings: true,
    showFollowUp: true,
    showSignature: true,
  },
};
