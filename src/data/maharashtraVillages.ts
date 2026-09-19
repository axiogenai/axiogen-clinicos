/**
 * Canonical Database of Cities, Towns, and Villages for:
 * - Kolhapur District
 * - Sangli District
 * - Satara District
 * 
 * Specifically optimized for receptionist auto-suggest with prefix & substring search,
 * Marathi aliases, taluka, and district badges.
 */

export interface VillageLocation {
  name: string;
  marathiName?: string;
  taluka: string;
  district: 'Kolhapur' | 'Sangli' | 'Satara';
  aliases?: string[];
}

export const POPULAR_NEARBY_CENTERS = [
  'Kolhapur',
  'Sangli',
  'Satara',
  'Karad',
  'Ichalkaranji',
  'Peth Vadgaon',
  'Vita',
  'Islampur',
  'Miraj',
  'Jaysingpur',
  'Wai',
  'Vaduj',
  'Tasgaon',
  'Phaltan',
  'Kagal',
  'Gadhinglaj',
];

export const MAHARASHTRA_VILLAGES: VillageLocation[] = [
  // ==========================================
  // KOLHAPUR DISTRICT
  // ==========================================
  // Cities & Major Centers
  { name: 'Kolhapur', marathiName: 'कोल्हापूर', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Ichalkaranji', marathiName: 'इचलकरंजी', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Jaysingpur', marathiName: 'जयसिंगपूर', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Peth Vadgaon', marathiName: 'पेठ वडगाव', taluka: 'Hatkanangale', district: 'Kolhapur', aliases: ['Vadgaon', 'Pethvadgaon'] },
  { name: 'Vadgaon', marathiName: 'वडगाव', taluka: 'Hatkanangale', district: 'Kolhapur', aliases: ['Peth Vadgaon', 'Vadgaon Kasba'] },
  { name: 'Hatkanangale', marathiName: 'हातकणंगले', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Shirol', marathiName: 'शिरोळ', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Kurundwad', marathiName: 'कुरुंदवाड', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Kagal', marathiName: 'कागल', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Murgud', marathiName: 'मुरगूड', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Gadhinglaj', marathiName: 'गडहिंग्लज', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Gargoti', marathiName: 'गारगोटी', taluka: 'Bhudargad', district: 'Kolhapur' },
  { name: 'Ajra', marathiName: 'आजरा', taluka: 'Ajra', district: 'Kolhapur' },
  { name: 'Chandgad', marathiName: 'चंदगड', taluka: 'Chandgad', district: 'Kolhapur' },
  { name: 'Radhanagari', marathiName: 'राधानगरी', taluka: 'Radhanagari', district: 'Kolhapur' },
  { name: 'Panhala', marathiName: 'पन्हाळा', taluka: 'Panhala', district: 'Kolhapur' },
  { name: 'Kodoli', marathiName: 'कोडोली', taluka: 'Panhala', district: 'Kolhapur' },
  { name: 'Warnanagar', marathiName: 'वारणानगर', taluka: 'Panhala', district: 'Kolhapur', aliases: ['Warna', 'Varna'] },
  { name: 'Hupari', marathiName: 'हुपरी', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Gandhinagar', marathiName: 'गांधीनगर', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Uchgaon', marathiName: 'उचगाव', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Malkapur Kolhapur', marathiName: 'मलकापूर (शाहुवाडी)', taluka: 'Shahuwadi', district: 'Kolhapur', aliases: ['Malkapur'] },

  // Karveer Taluka Villages
  { name: 'Kasba Bawada', marathiName: 'कसबा बावडा', taluka: 'Karveer', district: 'Kolhapur', aliases: ['Bawada'] },
  { name: 'Kalamba', marathiName: 'कळंबा', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Shiroli', marathiName: 'शिरोली', taluka: 'Karveer', district: 'Kolhapur', aliases: ['Shiroli MIDC', 'Shiroli Pulachi'] },
  { name: 'Balinga', marathiName: 'बालिंगा', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Chikhali', marathiName: 'चिखली', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Kuditre', marathiName: 'कुडित्रे', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Halondi', marathiName: 'हालोंडी', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Vadanange', marathiName: 'वदानंगे', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Nigave Dumala', marathiName: 'निगवे दुमाला', taluka: 'Karveer', district: 'Kolhapur', aliases: ['Nigave'] },
  { name: 'Nigave Khalasa', marathiName: 'निगवे खालसा', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Tamgaon', marathiName: 'तामगाव', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Vashi', marathiName: 'वाशी', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Shiye', marathiName: 'शिये', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Morewadi', marathiName: 'मोरेवाडी', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Pachgaon', marathiName: 'पाचगाव', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Kaneri', marathiName: 'कानेरी', taluka: 'Karveer', district: 'Kolhapur', aliases: ['Kaneri Math'] },
  { name: 'Kaneriwadi', marathiName: 'कानेरीवाडी', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Gokul Shirgaon', marathiName: 'गोकुळ शिरगाव', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Sarnobatwadi', marathiName: 'सरनोबतवाडी', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Ujalaiwadi', marathiName: 'उजळाईवाडी', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Girgaon', marathiName: 'गिरगाव', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Ispurli', marathiName: 'इस्पुर्ली', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Beed', marathiName: 'बीड', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Koparde', marathiName: 'कोपार्डे', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Sangrul', marathiName: 'सांगरुळ', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Mudshingi', marathiName: 'मुडशिंगी', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Vasagade', marathiName: 'वसगडे', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Vathar Karveer', marathiName: 'वाठार (करवीर)', taluka: 'Karveer', district: 'Kolhapur', aliases: ['Vathar'] },
  { name: 'Hanmantwadi', marathiName: 'हनमंतवाडी', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Sadoli', marathiName: 'सडोली', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Parite', marathiName: 'परीते', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Haldi', marathiName: 'हळदी', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Nagdevwadi', marathiName: 'नागदेववाडी', taluka: 'Karveer', district: 'Kolhapur' },
  { name: 'Vadange', marathiName: 'वडणगे', taluka: 'Karveer', district: 'Kolhapur' },

  // Hatkanangale Taluka Villages
  { name: 'Korochi', marathiName: 'कोरोची', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Kabnur', marathiName: 'कबणूर', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Tardal', marathiName: 'तारदाळ', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Rukadi', marathiName: 'रुई', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Herle', marathiName: 'हेरले', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Rendal', marathiName: 'रेंदाळ', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Pattankodoli', marathiName: 'पट्टणकोडोली', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Chandur', marathiName: 'चांदूर', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Manjare', marathiName: 'मांजरे', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Mangaon', marathiName: 'माणगाव', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Talandage', marathiName: 'तासगाव / तळंदगे', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Nave Danoli', marathiName: 'नवे दानोळी', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Khochi', marathiName: 'खोची', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Bhadole', marathiName: 'भादोले', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Vathar Tarf Vadgaon', marathiName: 'वाठार तर्फ वडगाव', taluka: 'Hatkanangale', district: 'Kolhapur', aliases: ['Vathar', 'Wathar'] },
  { name: 'Alte', marathiName: 'आळते', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Chokak', marathiName: 'चोकाक', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Atigre', marathiName: 'अतिग्रे', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Rui', marathiName: 'रुई', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Minche', marathiName: 'मिणचे', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Save', marathiName: 'सावे', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Sajani', marathiName: 'साजणी', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Shirati', marathiName: 'शिरटी', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Sambhapur', marathiName: 'सांभापूर', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Nagaon', marathiName: 'नागाव', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Kumbhoj', marathiName: 'कुंभोज', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Latavade', marathiName: 'लाटवडे', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Kini', marathiName: 'किणी', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Narande', marathiName: 'नरंदे', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Shirasale', marathiName: 'शिरसले', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Top', marathiName: 'टोप', taluka: 'Hatkanangale', district: 'Kolhapur' },
  { name: 'Majale', marathiName: 'माजले', taluka: 'Hatkanangale', district: 'Kolhapur' },

  // Shirol Taluka Villages
  { name: 'Narsobawadi', marathiName: 'नृसिंहवाडी (नरसोबावाडी)', taluka: 'Shirol', district: 'Kolhapur', aliases: ['Narasinhawadi', 'Wadi'] },
  { name: 'Danoli', marathiName: 'दानोळी', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Dharangutti', marathiName: 'धरंगुत्ती', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Takawade', marathiName: 'टाकवडे', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Ganeshwadi', marathiName: 'गणेशवाडी', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Kavathesar', marathiName: 'कवठेसार', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Shedbal Border', marathiName: 'शेडबाळ', taluka: 'Shirol', district: 'Kolhapur', aliases: ['Shedbal'] },
  { name: 'Agar', marathiName: 'आगर', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Aurwad', marathiName: 'औरवाड', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Bubnal', marathiName: 'बुबनाळ', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Ghosarwad', marathiName: 'घोसरावाड', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Hasur', marathiName: 'हासूर', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Herwad', marathiName: 'हेरवाड', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Khidrapur', marathiName: 'खिद्रापूर', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Kutwad', marathiName: 'कुतवाड', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Shirdhon Shirol', marathiName: 'शिरढोण', taluka: 'Shirol', district: 'Kolhapur', aliases: ['Shirdhon'] },
  { name: 'Terwad', marathiName: 'तेरवाड', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Nimshirgaon', marathiName: 'निमशिरगाव', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Udgaon', marathiName: 'उदगाव', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Akiwat', marathiName: 'अकिवाट', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Bastwad', marathiName: 'बास्तवाड', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Chipri', marathiName: 'चिपरी', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Kondigre', marathiName: 'कोंडिग्रे', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Alas', marathiName: 'आलास', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Gourwad', marathiName: 'गौरवाड', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Kavathe Guland', marathiName: 'कवठे गुलंद', taluka: 'Shirol', district: 'Kolhapur' },
  { name: 'Rajapur Shirol', marathiName: 'राजापूर', taluka: 'Shirol', district: 'Kolhapur' },

  // Kagal Taluka Villages
  { name: 'Kapashi', marathiName: 'सेनापती कापशी', taluka: 'Kagal', district: 'Kolhapur', aliases: ['Senapati Kapashi'] },
  { name: 'Bidri', marathiName: 'बिद्री', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Kenavade', marathiName: 'केनवडे', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Siddhannerli', marathiName: 'सिद्धनेर्ली', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Bastavade', marathiName: 'बास्तवडे', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Belanki Kagal', marathiName: 'बेलंकी', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Boravade', marathiName: 'बोरावडे', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Hamidwada', marathiName: 'हमीदवाडा', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Kasaba Sangaon', marathiName: 'कसबा सांगाव', taluka: 'Kagal', district: 'Kolhapur', aliases: ['Sangaon'] },
  { name: 'Sulkud', marathiName: 'सुलकूड', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Sonali', marathiName: 'सोनाळी', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Vhannur', marathiName: 'व्हान्नूर', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Yamagarni', marathiName: 'यमगर्णी', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Bamani Kagal', marathiName: 'बामणी', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Pimpalgaon Kagal', marathiName: 'पिंपळगाव', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Vairagwadi', marathiName: 'वैरागवाडी', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Lingnur', marathiName: 'लिंगनूर', taluka: 'Kagal', district: 'Kolhapur' },
  { name: 'Shahu Sugar Colony', marathiName: 'शाहू साखर कॉलनी', taluka: 'Kagal', district: 'Kolhapur' },

  // Gadhinglaj Taluka Villages
  { name: 'Nesari', marathiName: 'नेसरी', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Uttur', marathiName: 'उत्तूर', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Mahagaon', marathiName: 'महागाव', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Kadgaon', marathiName: 'कडगाव', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Harali', marathiName: 'हरळी', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Bhadgaon', marathiName: 'भाडगाव', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Gijawane', marathiName: 'गिजवणे', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Nandre Gadhinglaj', marathiName: 'नांद्रे', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Halkarni', marathiName: 'हलकर्णी', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Mugali', marathiName: 'मुगाळी', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Hitni', marathiName: 'हितनी', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Yaragatti', marathiName: 'यरगट्टी', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Hasurchampu', marathiName: 'हसूरचंपू', taluka: 'Gadhinglaj', district: 'Kolhapur' },
  { name: 'Beknal', marathiName: 'बेकनाळ', taluka: 'Gadhinglaj', district: 'Kolhapur' },

  // Bhudargad Taluka Villages
  { name: 'Kadgaon Bhudargad', marathiName: 'कडगाव (भुदरगड)', taluka: 'Bhudargad', district: 'Kolhapur' },
  { name: 'Madilge', marathiName: 'माडिलगे', taluka: 'Bhudargad', district: 'Kolhapur' },
  { name: 'Shengaon', marathiName: 'शेनगाव', taluka: 'Bhudargad', district: 'Kolhapur' },
  { name: 'Pimpalgaon Bhudargad', marathiName: 'पिंपळगाव', taluka: 'Bhudargad', district: 'Kolhapur' },
  { name: 'Pushpanagar', marathiName: 'पुष्पनगर', taluka: 'Bhudargad', district: 'Kolhapur' },
  { name: 'Tirwade', marathiName: 'तिरवडे', taluka: 'Bhudargad', district: 'Kolhapur' },
  { name: 'Dajipur', marathiName: 'दाजीपूर', taluka: 'Bhudargad', district: 'Kolhapur' },
  { name: 'Phatakwadi', marathiName: 'फाटकवाडी', taluka: 'Bhudargad', district: 'Kolhapur' },
  { name: 'Akurde', marathiName: 'आकुर्डे', taluka: 'Bhudargad', district: 'Kolhapur' },

  // Ajra Taluka Villages
  { name: 'Kowad Ajra', marathiName: 'कोवाड', taluka: 'Ajra', district: 'Kolhapur', aliases: ['Kowad'] },
  { name: 'Pernoli', marathiName: 'पेरणोली', taluka: 'Ajra', district: 'Kolhapur' },
  { name: 'Haloli', marathiName: 'हळोली', taluka: 'Ajra', district: 'Kolhapur' },
  { name: 'Masoli', marathiName: 'मासोली', taluka: 'Ajra', district: 'Kolhapur' },
  { name: 'Sohale Ajra', marathiName: 'सोहळे', taluka: 'Ajra', district: 'Kolhapur' },
  { name: 'Khanapur Ajra', marathiName: 'खानापूर', taluka: 'Ajra', district: 'Kolhapur' },
  { name: 'Watangi', marathiName: 'वाटांगी', taluka: 'Ajra', district: 'Kolhapur' },
  { name: 'Chaphawade', marathiName: 'चाफवडे', taluka: 'Ajra', district: 'Kolhapur' },

  // Chandgad Taluka Villages
  { name: 'Shinoli', marathiName: 'शिनोळी', taluka: 'Chandgad', district: 'Kolhapur' },
  { name: 'Adkur', marathiName: 'अडकुर', taluka: 'Chandgad', district: 'Kolhapur' },
  { name: 'Halkarni Chandgad', marathiName: 'हलकर्णी', taluka: 'Chandgad', district: 'Kolhapur' },
  { name: 'Karve Chandgad', marathiName: 'कार्वे', taluka: 'Chandgad', district: 'Kolhapur' },
  { name: 'Tudye', marathiName: 'तुर्ये', taluka: 'Chandgad', district: 'Kolhapur' },
  { name: 'Nagnur', marathiName: 'नागनूर', taluka: 'Chandgad', district: 'Kolhapur' },
  { name: 'Here', marathiName: 'हेरे', taluka: 'Chandgad', district: 'Kolhapur' },
  { name: 'Dholgarwadi', marathiName: 'ढोलगरवाडी', taluka: 'Chandgad', district: 'Kolhapur' },
  { name: 'Jangamhatti', marathiName: 'जंगमहट्टी', taluka: 'Chandgad', district: 'Kolhapur' },

  // Radhanagari Taluka Villages
  { name: 'Kasaba Tarale', marathiName: 'कसबा तारळे', taluka: 'Radhanagari', district: 'Kolhapur', aliases: ['Tarale'] },
  { name: 'Kaulav', marathiName: 'कौलव', taluka: 'Radhanagari', district: 'Kolhapur' },
  { name: 'Rashivade', marathiName: 'राशिवडे', taluka: 'Radhanagari', district: 'Kolhapur' },
  { name: 'Fejivade', marathiName: 'फेजीवडे', taluka: 'Radhanagari', district: 'Kolhapur' },
  { name: 'Solankur', marathiName: 'सोलंकूर', taluka: 'Radhanagari', district: 'Kolhapur' },
  { name: 'Sarawade', marathiName: 'सरवडे', taluka: 'Radhanagari', district: 'Kolhapur' },
  { name: 'Turambav', marathiName: 'तुरंबव', taluka: 'Radhanagari', district: 'Kolhapur' },
  { name: 'Dhamod', marathiName: 'धामोड', taluka: 'Radhanagari', district: 'Kolhapur' },

  // Panhala Taluka Villages
  { name: 'Poriye', marathiName: 'पोर्ये', taluka: 'Panhala', district: 'Kolhapur' },
  { name: 'Kotoli', marathiName: 'कोतोली', taluka: 'Panhala', district: 'Kolhapur' },
  { name: 'Borpadale', marathiName: 'बोरपाडळे', taluka: 'Panhala', district: 'Kolhapur' },
  { name: 'Kale', marathiName: 'काळे', taluka: 'Panhala', district: 'Kolhapur' },
  { name: 'Bajar Bhogaon', marathiName: 'बाजार भोगाव', taluka: 'Panhala', district: 'Kolhapur' },
  { name: 'Mhavashi', marathiName: 'म्हावशी', taluka: 'Panhala', district: 'Kolhapur' },
  { name: 'Kakhe', marathiName: 'काखे', taluka: 'Panhala', district: 'Kolhapur' },
  { name: 'Padal', marathiName: 'पाडळ', taluka: 'Panhala', district: 'Kolhapur' },
  { name: 'Kasaba Thane', marathiName: 'कसबा ठाणे', taluka: 'Panhala', district: 'Kolhapur' },

  // Shahuwadi Taluka Villages
  { name: 'Bambavade', marathiName: 'बामबावडे', taluka: 'Shahuwadi', district: 'Kolhapur' },
  { name: 'Shahuwadi', marathiName: 'शाहुवाडी', taluka: 'Shahuwadi', district: 'Kolhapur' },
  { name: 'Amba', marathiName: 'आंबा', taluka: 'Shahuwadi', district: 'Kolhapur' },
  { name: 'Yelane', marathiName: 'येळणे', taluka: 'Shahuwadi', district: 'Kolhapur' },
  { name: 'Perid', marathiName: 'पेरीड', taluka: 'Shahuwadi', district: 'Kolhapur' },
  { name: 'Sarud', marathiName: 'सरुड', taluka: 'Shahuwadi', district: 'Kolhapur' },
  { name: 'Thergaon', marathiName: 'थेरगाव', taluka: 'Shahuwadi', district: 'Kolhapur' },
  { name: 'Barki', marathiName: 'बार्की', taluka: 'Shahuwadi', district: 'Kolhapur' },

  // Gaganbawda Taluka Villages
  { name: 'Gaganbawda', marathiName: 'गगनबावडा', taluka: 'Gaganbawda', district: 'Kolhapur', aliases: ['Bawda'] },
  { name: 'Borbet', marathiName: 'बोरबेट', taluka: 'Gaganbawda', district: 'Kolhapur' },
  { name: 'Tisangi', marathiName: 'तिसंगी', taluka: 'Gaganbawda', district: 'Kolhapur' },
  { name: 'Asandoli', marathiName: 'असांदोली', taluka: 'Gaganbawda', district: 'Kolhapur' },
  { name: 'Salvan', marathiName: 'सळवण', taluka: 'Gaganbawda', district: 'Kolhapur' },


  // ==========================================
  // SANGLI DISTRICT
  // ==========================================
  // Cities & Major Centers
  { name: 'Sangli', marathiName: 'सांगली', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Miraj', marathiName: 'मिरज', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Kupwad', marathiName: 'कुपवाड', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Islampur', marathiName: 'इस्लापूर (उरुण-इस्लापूर)', taluka: 'Walwa', district: 'Sangli', aliases: ['Urun Islampur', 'Urun-Islampur'] },
  { name: 'Ashta', marathiName: 'आष्टा', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Vita', marathiName: 'विटा', taluka: 'Khanapur', district: 'Sangli', aliases: ['Khanapur-Vita'] },
  { name: 'Tasgaon', marathiName: 'तासगाव', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Shirala', marathiName: 'शिराळा', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Palus', marathiName: 'पलूस', taluka: 'Palus', district: 'Sangli' },
  { name: 'Kadegaon', marathiName: 'कडेगाव', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Jath', marathiName: 'जत', taluka: 'Jath', district: 'Sangli' },
  { name: 'Atpadi', marathiName: 'आटपाडी', taluka: 'Atpadi', district: 'Sangli' },
  { name: 'Kavathe Mahankal', marathiName: 'कवठे महांकाळ', taluka: 'Kavathe Mahankal', district: 'Sangli', aliases: ['Kavathemahankal'] },
  { name: 'Walwa', marathiName: 'वाळवा', taluka: 'Walwa', district: 'Sangli', aliases: ['Valva'] },

  // Miraj Taluka Villages
  { name: 'Madhavnagar', marathiName: 'माधवनगर', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Budhgaon', marathiName: 'बुधगाव', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Kavalapur', marathiName: 'कवलापूर', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Arag', marathiName: 'आरग', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Bedag', marathiName: 'बेडग', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Malgaon', marathiName: 'माळगाव', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Salgare', marathiName: 'सलगरे', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Bolwad', marathiName: 'बोलवाड', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Savali', marathiName: 'सावळी', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Tanang', marathiName: 'तानंग', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Haripur', marathiName: 'हरिपूर', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Bamnoli Sangli', marathiName: 'बामनोळी', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Mhaisal', marathiName: 'म्हैसाळ', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Shirasgaon', marathiName: 'शिरसगाव', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Belanki', marathiName: 'बेलंकी', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Sonyal', marathiName: 'सोन्याळ', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Kasabe Digraj', marathiName: 'कसबे डिग्रज', taluka: 'Miraj', district: 'Sangli', aliases: ['Digraj'] },
  { name: 'Karnal', marathiName: 'कर्नाळ', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Padmale', marathiName: 'पद्मळे', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Bramhanpuri', marathiName: 'ब्राह्मणपुरी', taluka: 'Miraj', district: 'Sangli' },
  { name: 'Samdoli', marathiName: 'समडोळी', taluka: 'Miraj', district: 'Sangli' },

  // Walwa Taluka Villages
  { name: 'Peth', marathiName: 'पेठ', taluka: 'Walwa', district: 'Sangli', aliases: ['Peth Naka'] },
  { name: 'Kameri', marathiName: 'कामेरी', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Borgaon Walwa', marathiName: 'बोरगाव', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Dudhgaon', marathiName: 'दुधगाव', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Bagani', marathiName: 'बागणी', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Bahe', marathiName: 'बाहे', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Kasegaon', marathiName: 'कासेगाव', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Nerle', marathiName: 'नेर्ले', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Shenoli Walwa', marathiName: 'शेणोली', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Tambave Walwa', marathiName: 'तांबवे', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Yelur', marathiName: 'येळूर', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Gotkhindi', marathiName: 'गोतखिंडी', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Rethare Harnaksha', marathiName: 'रेठरे हरणाक्ष', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Wategaon', marathiName: 'वाटेगाव', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Shirate', marathiName: 'शिरटे', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Hubalwadi', marathiName: 'हुबळवाडी', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Chikurde', marathiName: 'चिकुर्डे', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Tandulwadi', marathiName: 'तांदुळवाडी', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Takari', marathiName: 'ताकारी', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Bavachi', marathiName: 'बावाची', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Mardwadi', marathiName: 'मर्दवाडी', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Kurlap', marathiName: 'कुर्लापूर', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Itkare', marathiName: 'इटकरे', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Shirgaon Walwa', marathiName: 'शिरगाव', taluka: 'Walwa', district: 'Sangli' },
  { name: 'Kole Walwa', marathiName: 'कोळे', taluka: 'Walwa', district: 'Sangli' },

  // Shirala Taluka Villages
  { name: 'Kokrud', marathiName: 'कोकरूड', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Charan', marathiName: 'चरण', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Bilashi', marathiName: 'बिलाशी', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Mangaruk', marathiName: 'मांगरूळ', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Sagaon', marathiName: 'सागाव', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Rile', marathiName: 'रिळे', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Arala', marathiName: 'आरळा', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Shirshi', marathiName: 'शिरशी', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Punvat', marathiName: 'पुणवत', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Padali Shirala', marathiName: 'पाडळी', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Ingrun', marathiName: 'इंगरुण', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Antri', marathiName: 'अंत्री', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Chande', marathiName: 'चांदे', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Bhedasgaon', marathiName: 'भेदसगाव', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Kande', marathiName: 'कांदे', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Mangle', marathiName: 'मांगले', taluka: 'Shirala', district: 'Sangli' },
  { name: 'Morbag', marathiName: 'मोरबाग', taluka: 'Shirala', district: 'Sangli' },

  // Khanapur / Vita Taluka Villages
  { name: 'Khanapur', marathiName: 'खानापूर', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Bhalwani', marathiName: 'भालवणी', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Lengare', marathiName: 'लेंगरे', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Pare', marathiName: 'पारे', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Benapur', marathiName: 'बेनापूर', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Balsand', marathiName: 'बळसंड', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Revnal', marathiName: 'रेवनाळ', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Hingangaon Khanapur', marathiName: 'हिंगणगाव', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Jadhavwadi Khanapur', marathiName: 'जाधववाडी', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Ghoti', marathiName: 'घोटील', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Gardi', marathiName: 'गार्डी', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Shirsuphal', marathiName: 'शिरसुफळ', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Devrashtre', marathiName: 'देवराष्ट्रे', taluka: 'Khanapur', district: 'Sangli' },
  { name: 'Karve Vita', marathiName: 'कार्वे', taluka: 'Khanapur', district: 'Sangli' },

  // Tasgaon Taluka Villages
  { name: 'Savlaj', marathiName: 'सावळज', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Manerajuri', marathiName: 'मणेराजुरी', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Bhilawadi', marathiName: 'भिलवडी', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Chinchani Tasgaon', marathiName: 'चिंचणी', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Visapur', marathiName: 'विसापूर', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Bastawad Tasgaon', marathiName: 'बस्तवाड', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Nimani', marathiName: 'निमाणी', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Nagaon Kavate', marathiName: 'नागाव कवठे', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Shirgaon Tasgaon', marathiName: 'शिरगाव', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Vasumbe', marathiName: 'वसुंबे', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Turmuri', marathiName: 'तुर्मुरी', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Gavhan', marathiName: 'गव्हाण', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Kumthe Tasgaon', marathiName: 'कुमठे', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Siddhewadi', marathiName: 'सिद्धेवाडी', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Jarandi', marathiName: 'जारंडी', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Ped', marathiName: 'पेड', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Punadi', marathiName: 'पुनाडी', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Anjani', marathiName: 'अंजनी', taluka: 'Tasgaon', district: 'Sangli' },
  { name: 'Balgavade', marathiName: 'बळगवडे', taluka: 'Tasgaon', district: 'Sangli' },

  // Palus Taluka Villages
  { name: 'Kundal', marathiName: 'कुंडल', taluka: 'Palus', district: 'Sangli' },
  { name: 'Kirloskarvadi', marathiName: 'किर्लोस्करवाडी', taluka: 'Palus', district: 'Sangli', aliases: ['Kirloskarwadi'] },
  { name: 'Ramanandnagar', marathiName: 'रामानंदनगर', taluka: 'Palus', district: 'Sangli' },
  { name: 'Sawantpur', marathiName: 'सावंतपूर', taluka: 'Palus', district: 'Sangli' },
  { name: 'Burli', marathiName: 'बुर्ली', taluka: 'Palus', district: 'Sangli' },
  { name: 'Dudhondi', marathiName: 'दुधोंडी', taluka: 'Palus', district: 'Sangli' },
  { name: 'Nagthane Palus', marathiName: 'नागठाणे', taluka: 'Palus', district: 'Sangli' },
  { name: 'Ankalkhop', marathiName: 'अंकलखोप', taluka: 'Palus', district: 'Sangli' },
  { name: 'Bramhanal', marathiName: 'ब्राह्मणनाळ', taluka: 'Palus', district: 'Sangli' },
  { name: 'Tupari', marathiName: 'तुपारी', taluka: 'Palus', district: 'Sangli' },
  { name: 'Sandgeewadi', marathiName: 'सांडगेवाडी', taluka: 'Palus', district: 'Sangli' },
  { name: 'Ghogaon Palus', marathiName: 'घोगाव', taluka: 'Palus', district: 'Sangli' },

  // Kadegaon Taluka Villages
  { name: 'Kavathe Ekand', marathiName: 'कवठे एकंद', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Wangi', marathiName: 'वांगी', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Sohale', marathiName: 'सोहळे', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Hingangaon Bk', marathiName: 'हिंगणगाव बुद्रुक', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Tadavale', marathiName: 'ताडवळे', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Kotij', marathiName: 'कोतीज', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Nerli', marathiName: 'नेर्ली', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Shivajinagar Kadegaon', marathiName: 'शिवाजीनगर', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Mohityanche Vadgaon', marathiName: 'मोहितेचे वडगाव', taluka: 'Kadegaon', district: 'Sangli', aliases: ['Vadgaon', 'Mohite Vadgaon'] },
  { name: 'Kadepur', marathiName: 'कडेपूर', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Shalgaon', marathiName: 'शालगाव', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Upalwi', marathiName: 'उपाळवी', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Sonsal', marathiName: 'सोंसळ', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Raygaon', marathiName: 'रायगाव', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Vihapur', marathiName: 'विहापूर', taluka: 'Kadegaon', district: 'Sangli' },
  { name: 'Degaon Kadegaon', marathiName: 'देगाव', taluka: 'Kadegaon', district: 'Sangli' },

  // Atpadi Taluka Villages
  { name: 'Dighanchi', marathiName: 'दिघंची', taluka: 'Atpadi', district: 'Sangli' },
  { name: 'Nelkaranji', marathiName: 'नेलकरंजी', taluka: 'Atpadi', district: 'Sangli' },
  { name: 'Karkhel', marathiName: 'करखेल', taluka: 'Atpadi', district: 'Sangli' },
  { name: 'Madgule', marathiName: 'माडगुळे', taluka: 'Atpadi', district: 'Sangli' },
  { name: 'Tadwale Atpadi', marathiName: 'ताडवळे', taluka: 'Atpadi', district: 'Sangli' },
  { name: 'Gomewadi', marathiName: 'गोमेवाडी', taluka: 'Atpadi', district: 'Sangli' },
  { name: 'Zare', marathiName: 'झरे', taluka: 'Atpadi', district: 'Sangli' },
  { name: 'Kargani', marathiName: 'करगणी', taluka: 'Atpadi', district: 'Sangli' },
  { name: 'Ghartan', marathiName: 'घरटन', taluka: 'Atpadi', district: 'Sangli' },
  { name: 'Shetfale', marathiName: 'शेतफळे', taluka: 'Atpadi', district: 'Sangli' },
  { name: 'Bholewadi', marathiName: 'भोलेवाडी', taluka: 'Atpadi', district: 'Sangli' },

  // Jath Taluka Villages
  { name: 'Umadi', marathiName: 'उमदी', taluka: 'Jath', district: 'Sangli' },
  { name: 'Sanmadi', marathiName: 'सनमडी', taluka: 'Jath', district: 'Sangli' },
  { name: 'Sankh', marathiName: 'संख', taluka: 'Jath', district: 'Sangli' },
  { name: 'Shegaon Jath', marathiName: 'शेगाव', taluka: 'Jath', district: 'Sangli' },
  { name: 'Dafalapur', marathiName: 'डफळापूर', taluka: 'Jath', district: 'Sangli' },
  { name: 'Walekhindi', marathiName: 'वाळेखिंडी', taluka: 'Jath', district: 'Sangli' },
  { name: 'Bilur', marathiName: 'बिलूर', taluka: 'Jath', district: 'Sangli' },
  { name: 'Madgyal', marathiName: 'मडग्याळ', taluka: 'Jath', district: 'Sangli' },
  { name: 'Muchandi', marathiName: 'मुचंडी', taluka: 'Jath', district: 'Sangli' },
  { name: 'Daribadachi', marathiName: 'दरीबडची', taluka: 'Jath', district: 'Sangli' },
  { name: 'Mendhigiri', marathiName: 'मेंढीगिरी', taluka: 'Jath', district: 'Sangli' },
  { name: 'Birnal', marathiName: 'बिरनाळ', taluka: 'Jath', district: 'Sangli' },
  { name: 'Hullur', marathiName: 'हुल्लूर', taluka: 'Jath', district: 'Sangli' },
  { name: 'Tippehalli', marathiName: 'तिप्पेहळ्ळी', taluka: 'Jath', district: 'Sangli' },
  { name: 'Walsang', marathiName: 'वळसंग', taluka: 'Jath', district: 'Sangli' },
  { name: 'Vhaspeth', marathiName: 'व्हास्पेट', taluka: 'Jath', district: 'Sangli' },

  // Kavathe Mahankal Taluka Villages
  { name: 'Dhalgaon', marathiName: 'ढालगाव', taluka: 'Kavathe Mahankal', district: 'Sangli' },
  { name: 'Karkamb', marathiName: 'करकंब', taluka: 'Kavathe Mahankal', district: 'Sangli' },
  { name: 'Borgaon Kavathe', marathiName: 'बोरगाव', taluka: 'Kavathe Mahankal', district: 'Sangli' },
  { name: 'Desing', marathiName: 'देशिंग', taluka: 'Kavathe Mahankal', district: 'Sangli' },
  { name: 'Aagarkhed', marathiName: 'आगरखेड', taluka: 'Kavathe Mahankal', district: 'Sangli' },
  { name: 'Ranjani', marathiName: 'रांजणी', taluka: 'Kavathe Mahankal', district: 'Sangli' },
  { name: 'Shirdhon Kavathe', marathiName: 'शिरढोण', taluka: 'Kavathe Mahankal', district: 'Sangli', aliases: ['Shirdhon'] },
  { name: 'Irani', marathiName: 'इराणी', taluka: 'Kavathe Mahankal', district: 'Sangli' },
  { name: 'Ghatnande', marathiName: 'घाटनंदे', taluka: 'Kavathe Mahankal', district: 'Sangli' },
  { name: 'Nagaj', marathiName: 'नागझ', taluka: 'Kavathe Mahankal', district: 'Sangli' },
  { name: 'Morab', marathiName: 'मोराब', taluka: 'Kavathe Mahankal', district: 'Sangli' },


  // ==========================================
  // SATARA DISTRICT
  // ==========================================
  // Cities & Major Centers
  { name: 'Satara', marathiName: 'सातारा', taluka: 'Satara', district: 'Satara' },
  { name: 'Karad', marathiName: 'कराड', taluka: 'Karad', district: 'Satara' },
  { name: 'Malkapur Satara', marathiName: 'मलकापूर (कराड)', taluka: 'Karad', district: 'Satara', aliases: ['Malkapur'] },
  { name: 'Wai', marathiName: 'वाई', taluka: 'Wai', district: 'Satara' },
  { name: 'Phaltan', marathiName: 'फलटण', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Shirwal', marathiName: 'शिरवळ', taluka: 'Khandala', district: 'Satara' },
  { name: 'Khandala', marathiName: 'खंडाळा', taluka: 'Khandala', district: 'Satara' },
  { name: 'Koregaon', marathiName: 'कोरेगाव', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Rahimatpur', marathiName: 'रहिमतपूर', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Vaduj', marathiName: 'वडूज', taluka: 'Khatav', district: 'Satara' },
  { name: 'Dahiwadi', marathiName: 'दहिवाडी', taluka: 'Man', district: 'Satara' },
  { name: 'Mhaswad', marathiName: 'म्हसवड', taluka: 'Man', district: 'Satara' },
  { name: 'Patan', marathiName: 'पाटण', taluka: 'Patan', district: 'Satara' },
  { name: 'Mahabaleshwar', marathiName: 'महाबळेश्वर', taluka: 'Mahabaleshwar', district: 'Satara' },
  { name: 'Panchgani', marathiName: 'पाचगणी', taluka: 'Mahabaleshwar', district: 'Satara' },
  { name: 'Lonand', marathiName: 'लोणंद', taluka: 'Khandala', district: 'Satara' },
  { name: 'Surur', marathiName: 'सुरुड / सुरुर', taluka: 'Wai', district: 'Satara' },
  { name: 'Pusegaon', marathiName: 'पुसेगाव', taluka: 'Khatav', district: 'Satara' },
  { name: 'Mayani', marathiName: 'मयाणी', taluka: 'Khatav', district: 'Satara' },
  { name: 'Oundh', marathiName: 'औंध', taluka: 'Khatav', district: 'Satara' },

  // Karad Taluka Villages
  { name: 'Ogalewadi', marathiName: 'ओगलेवाडी', taluka: 'Karad', district: 'Satara' },
  { name: 'Umbraj', marathiName: 'उंब्रज', taluka: 'Karad', district: 'Satara' },
  { name: 'Masur', marathiName: 'मसूर', taluka: 'Karad', district: 'Satara' },
  { name: 'Kale Karad', marathiName: 'काळे', taluka: 'Karad', district: 'Satara' },
  { name: 'Shenoli', marathiName: 'शेणोली', taluka: 'Karad', district: 'Satara' },
  { name: 'Kole', marathiName: 'कोळे', taluka: 'Karad', district: 'Satara' },
  { name: 'Undale', marathiName: 'उंडाळे', taluka: 'Karad', district: 'Satara' },
  { name: 'Wagheri', marathiName: 'वाघेरी', taluka: 'Karad', district: 'Satara' },
  { name: 'Rethare Budruk', marathiName: 'रेठरे बुद्रुक', taluka: 'Karad', district: 'Satara' },
  { name: 'Shirwade', marathiName: 'शिरवडे', taluka: 'Karad', district: 'Satara' },
  { name: 'Wing Karad', marathiName: 'विंग', taluka: 'Karad', district: 'Satara' },
  { name: 'Vadgaon Haveli', marathiName: 'वडगाव हवेली', taluka: 'Karad', district: 'Satara', aliases: ['Vadgaon'] },
  { name: 'Helgaon', marathiName: 'हेळगाव', taluka: 'Karad', district: 'Satara' },
  { name: 'Saidapur', marathiName: 'सैदापूर', taluka: 'Karad', district: 'Satara' },
  { name: 'Chachegaon', marathiName: 'चाचेगाव', taluka: 'Karad', district: 'Satara' },
  { name: 'Taswade', marathiName: 'तासवडे', taluka: 'Karad', district: 'Satara' },
  { name: 'Supne', marathiName: 'सुपने', taluka: 'Karad', district: 'Satara' },
  { name: 'Koparde Karad', marathiName: 'कोपार्डे', taluka: 'Karad', district: 'Satara' },
  { name: 'Belawade', marathiName: 'बेलावडे', taluka: 'Karad', district: 'Satara' },
  { name: 'Varunji', marathiName: 'वारुंजी', taluka: 'Karad', district: 'Satara' },
  { name: 'Vasantgad', marathiName: 'वसंतगड', taluka: 'Karad', district: 'Satara' },
  { name: 'Shamgaon', marathiName: 'शामगाव', taluka: 'Karad', district: 'Satara' },
  { name: 'Indoli', marathiName: 'इंदोली', taluka: 'Karad', district: 'Satara' },
  { name: 'Korti', marathiName: 'कोर्टी', taluka: 'Karad', district: 'Satara' },
  { name: 'Beldare', marathiName: 'बेलदरे', taluka: 'Karad', district: 'Satara' },
  { name: 'Tambave Karad', marathiName: 'तांबवे', taluka: 'Karad', district: 'Satara' },
  { name: 'Kese', marathiName: 'केसे', taluka: 'Karad', district: 'Satara' },
  { name: 'Gholapwadi', marathiName: 'घोलपवाडी', taluka: 'Karad', district: 'Satara' },
  { name: 'Vidyanagar Karad', marathiName: 'विद्यानगर (कराड)', taluka: 'Karad', district: 'Satara' },
  { name: 'Karve Karad', marathiName: 'कार्वे', taluka: 'Karad', district: 'Satara' },
  { name: 'Shere', marathiName: 'शेरे', taluka: 'Karad', district: 'Satara' },
  { name: 'Ghogaon Karad', marathiName: 'घोगाव', taluka: 'Karad', district: 'Satara' },
  { name: 'Ond', marathiName: 'ओंड', taluka: 'Karad', district: 'Satara' },

  // Satara Taluka Villages
  { name: 'Godoli', marathiName: 'गोडोली', taluka: 'Satara', district: 'Satara' },
  { name: 'Shahunagar', marathiName: 'शाहूनगर', taluka: 'Satara', district: 'Satara' },
  { name: 'Kodoli Satara', marathiName: 'कोडोली (सातारा)', taluka: 'Satara', district: 'Satara', aliases: ['Kodoli'] },
  { name: 'Khed Satara', marathiName: 'खेड', taluka: 'Satara', district: 'Satara' },
  { name: 'Mahagaon Satara', marathiName: 'महागाव', taluka: 'Satara', district: 'Satara' },
  { name: 'Limb', marathiName: 'लिंब', taluka: 'Satara', district: 'Satara' },
  { name: 'Varna Satara', marathiName: 'वारणा', taluka: 'Satara', district: 'Satara' },
  { name: 'Borgaon Satara', marathiName: 'बोरगाव', taluka: 'Satara', district: 'Satara' },
  { name: 'Nagthane', marathiName: 'नागठाणे', taluka: 'Satara', district: 'Satara' },
  { name: 'Padali Satara', marathiName: 'पाडळी', taluka: 'Satara', district: 'Satara' },
  { name: 'Degaon Satara', marathiName: 'देगाव', taluka: 'Satara', district: 'Satara' },
  { name: 'Shendre', marathiName: 'शेंद्रे', taluka: 'Satara', district: 'Satara' },
  { name: 'Tasgaon Satara', marathiName: 'तासगाव (सातारा)', taluka: 'Satara', district: 'Satara' },
  { name: 'Kanher', marathiName: 'कन्हेरी / कण्हेर', taluka: 'Satara', district: 'Satara' },
  { name: 'Dare', marathiName: 'दरे', taluka: 'Satara', district: 'Satara' },
  { name: 'Arvi', marathiName: 'आरवी', taluka: 'Satara', district: 'Satara' },
  { name: 'Waduth', marathiName: 'वडूथ', taluka: 'Satara', district: 'Satara' },
  { name: 'Kshetra Mahuli', marathiName: 'क्षेत्र माहुली', taluka: 'Satara', district: 'Satara', aliases: ['Mahuli'] },
  { name: 'Songaon', marathiName: 'सोनगाव', taluka: 'Satara', district: 'Satara' },
  { name: 'Karanje', marathiName: 'करंजे', taluka: 'Satara', district: 'Satara' },
  { name: 'Kondhave', marathiName: 'कोंडवे', taluka: 'Satara', district: 'Satara' },

  // Wai Taluka Villages
  { name: 'Bhuinj', marathiName: 'भुईंज', taluka: 'Wai', district: 'Satara' },
  { name: 'Pachwad', marathiName: 'पाचवड', taluka: 'Wai', district: 'Satara' },
  { name: 'Bavdhan', marathiName: 'बावधन', taluka: 'Wai', district: 'Satara' },
  { name: 'Menawali', marathiName: 'मेणवली', taluka: 'Wai', district: 'Satara' },
  { name: 'Pasarni', marathiName: 'पसारणी', taluka: 'Wai', district: 'Satara' },
  { name: 'Kenjal', marathiName: 'केंजळ', taluka: 'Wai', district: 'Satara' },
  { name: 'Dhom', marathiName: 'धोम', taluka: 'Wai', district: 'Satara' },
  { name: 'Pandavgad', marathiName: 'पांडवगड', taluka: 'Wai', district: 'Satara' },
  { name: 'Vyahali', marathiName: 'व्याहाळी', taluka: 'Wai', district: 'Satara' },
  { name: 'Jor', marathiName: 'जोर', taluka: 'Wai', district: 'Satara' },
  { name: 'Songir', marathiName: 'सोनगीर', taluka: 'Wai', district: 'Satara' },
  { name: 'Asle', marathiName: 'आसले', taluka: 'Wai', district: 'Satara' },
  { name: 'Gulumb', marathiName: 'गुळुंब', taluka: 'Wai', district: 'Satara' },
  { name: 'Shirgaon Wai', marathiName: 'शिरगाव', taluka: 'Wai', district: 'Satara' },

  // Phaltan Taluka Villages
  { name: 'Taradgaon', marathiName: 'तरडगाव', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Sakharwadi', marathiName: 'साखरवाडी', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Barad', marathiName: 'बरड', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Vidani', marathiName: 'विडाणी', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Girvi', marathiName: 'गिरवी', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Asu', marathiName: 'आसू', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Gunware', marathiName: 'गुणवरे', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Rajale', marathiName: 'राजाळे', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Wathar Nimbalkar', marathiName: 'वाठार निंबाळकर', taluka: 'Phaltan', district: 'Satara', aliases: ['Wathar', 'Vathar'] },
  { name: 'Hol', marathiName: 'होळ', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Adarki', marathiName: 'आदर्की', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Javli Phaltan', marathiName: 'जावळी', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Dhoki', marathiName: 'ढोकी', taluka: 'Phaltan', district: 'Satara' },
  { name: 'Nimblak', marathiName: 'निंबळक', taluka: 'Phaltan', district: 'Satara' },

  // Khandala Taluka Villages
  { name: 'Ahire', marathiName: 'आहिरे', taluka: 'Khandala', district: 'Satara' },
  { name: 'Wing Khandala', marathiName: 'विंग', taluka: 'Khandala', district: 'Satara' },
  { name: 'Naigaon', marathiName: 'नायगाव', taluka: 'Khandala', district: 'Satara' },
  { name: 'Morve', marathiName: 'मोरवे', taluka: 'Khandala', district: 'Satara' },
  { name: 'Pargaon', marathiName: 'पारगाव', taluka: 'Khandala', district: 'Satara' },
  { name: 'Kanhe', marathiName: 'कान्हे', taluka: 'Khandala', district: 'Satara' },
  { name: 'Bori', marathiName: 'बोरी', taluka: 'Khandala', district: 'Satara' },
  { name: 'Bavada', marathiName: 'बावडा', taluka: 'Khandala', district: 'Satara' },
  { name: 'Wadgaon Khandala', marathiName: 'वडगाव', taluka: 'Khandala', district: 'Satara', aliases: ['Vadgaon'] },
  { name: 'Shindewadi', marathiName: 'शिंदेवाडी', taluka: 'Khandala', district: 'Satara' },

  // Koregaon Taluka Villages
  { name: 'Wathar Station', marathiName: 'वाठार स्टेशन', taluka: 'Koregaon', district: 'Satara', aliases: ['Wathar', 'Vathar'] },
  { name: 'Kinhai', marathiName: 'किन्हाई', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Kumthe Koregaon', marathiName: 'कुमठे', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Khed Koregaon', marathiName: 'खेड', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Pimpode Budruk', marathiName: 'पिंपोडे बुद्रुक', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Ekambe', marathiName: 'एकंबे', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Jalgaon', marathiName: 'जळगाव', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Loni', marathiName: 'लोणी', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Saswad Koregaon', marathiName: 'सासवड', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Deur', marathiName: 'देऊर', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Satara Road', marathiName: 'सातारा रोड', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Wagholi', marathiName: 'वाघोली', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Triputi', marathiName: 'त्रिपूटी', taluka: 'Koregaon', district: 'Satara' },
  { name: 'Ambavade', marathiName: 'आंबवडे', taluka: 'Koregaon', district: 'Satara' },

  // Khatav / Vaduj Taluka Villages
  { name: 'Khatav', marathiName: 'खटाव', taluka: 'Khatav', district: 'Satara' },
  { name: 'Katarkhadak', marathiName: 'कतारखडक', taluka: 'Khatav', district: 'Satara' },
  { name: 'Pusesavali', marathiName: 'पुसेसावळी', taluka: 'Khatav', district: 'Satara' },
  { name: 'Daruj', marathiName: 'दारूज', taluka: 'Khatav', district: 'Satara' },
  { name: 'Nimsod', marathiName: 'निमसोड', taluka: 'Khatav', district: 'Satara' },
  { name: 'Enkul', marathiName: 'येणकुळ', taluka: 'Khatav', district: 'Satara' },
  { name: 'Pachwad Khatav', marathiName: 'पाचवड', taluka: 'Khatav', district: 'Satara' },
  { name: 'Gursale', marathiName: 'गुरसाळे', taluka: 'Khatav', district: 'Satara' },
  { name: 'Bhosare', marathiName: 'भोसरे', taluka: 'Khatav', district: 'Satara' },
  { name: 'Mol', marathiName: 'मोल', taluka: 'Khatav', district: 'Satara' },
  { name: 'Diskal', marathiName: 'दिसकळ', taluka: 'Khatav', district: 'Satara' },
  { name: 'Kuroli', marathiName: 'कुरोली', taluka: 'Khatav', district: 'Satara' },
  { name: 'Siddheswar', marathiName: 'सिद्धेश्वर', taluka: 'Khatav', district: 'Satara' },

  // Man / Dahiwadi Taluka Villages
  { name: 'Gondawale', marathiName: 'गोंदवले (बुद्रुक/खुर्द)', taluka: 'Man', district: 'Satara', aliases: ['Gondawale Budruk', 'Gondawale Khurd'] },
  { name: 'Pingali', marathiName: 'पिंगळी', taluka: 'Man', district: 'Satara' },
  { name: 'Kukudwad', marathiName: 'कुकुडवाड', taluka: 'Man', district: 'Satara' },
  { name: 'Andhali', marathiName: 'आंधळी', taluka: 'Man', district: 'Satara' },
  { name: 'Varkute', marathiName: 'वरकुटे', taluka: 'Man', district: 'Satara' },
  { name: 'Ranand', marathiName: 'राणंद', taluka: 'Man', district: 'Satara' },
  { name: 'Pulkoti', marathiName: 'पळकोटी', taluka: 'Man', district: 'Satara' },
  { name: 'Bidal', marathiName: 'बिडाल', taluka: 'Man', district: 'Satara' },
  { name: 'Virali', marathiName: 'विराळी', taluka: 'Man', district: 'Satara' },
  { name: 'Shambhumahadev', marathiName: 'शंभूमहादेव (शिखर शिंगणापूर)', taluka: 'Man', district: 'Satara', aliases: ['Shikhar Shinganapur', 'Shinganapur'] },
  { name: 'Narwane', marathiName: 'नरवणे', taluka: 'Man', district: 'Satara' },
  { name: 'Malwadi Man', marathiName: 'माळवाडी', taluka: 'Man', district: 'Satara' },
  { name: 'Kulakjai', marathiName: 'कुळकजाई', taluka: 'Man', district: 'Satara' },

  // Patan Taluka Villages
  { name: 'Koynanagar', marathiName: 'कोयनानगर', taluka: 'Patan', district: 'Satara', aliases: ['Koyna'] },
  { name: 'Helwak', marathiName: 'हेळवाक', taluka: 'Patan', district: 'Satara' },
  { name: 'Malharpeth', marathiName: 'मल्हारपेठ', taluka: 'Patan', district: 'Satara' },
  { name: 'Tarale Patan', marathiName: 'तारळे', taluka: 'Patan', district: 'Satara' },
  { name: 'Dhebewadi', marathiName: 'ढेबेवाडी', taluka: 'Patan', district: 'Satara' },
  { name: 'Morgiri', marathiName: 'मोरगिरी', taluka: 'Patan', district: 'Satara' },
  { name: 'Marali Patan', marathiName: 'मराळी', taluka: 'Patan', district: 'Satara' },
  { name: 'Rasati', marathiName: 'रसती', taluka: 'Patan', district: 'Satara' },
  { name: 'Toloshi', marathiName: 'टोळोशी', taluka: 'Patan', district: 'Satara' },
  { name: 'Chaphal', marathiName: 'चाफळ', taluka: 'Patan', district: 'Satara' },
  { name: 'Garavade', marathiName: 'गारवडे', taluka: 'Patan', district: 'Satara' },
  { name: 'Marul', marathiName: 'मारुल', taluka: 'Patan', district: 'Satara' },
  { name: 'Yerad', marathiName: 'येरड', taluka: 'Patan', district: 'Satara' },
  { name: 'Manyachiwadi', marathiName: 'मान्याचीवाडी', taluka: 'Patan', district: 'Satara' },

  // Mahabaleshwar Taluka Villages
  { name: 'Kshetra Mahabaleshwar', marathiName: 'क्षेत्र महाबळेश्वर', taluka: 'Mahabaleshwar', district: 'Satara' },
  { name: 'Metgutad', marathiName: 'मेटगुताड', taluka: 'Mahabaleshwar', district: 'Satara' },
  { name: 'Bhilar', marathiName: 'भिलार (पुस्तकांचे गाव)', taluka: 'Mahabaleshwar', district: 'Satara' },
  { name: 'Tapola', marathiName: 'तापोळा (मिनी काश्मीर)', taluka: 'Mahabaleshwar', district: 'Satara' },
  { name: 'Taldeo', marathiName: 'ताळदेव', taluka: 'Mahabaleshwar', district: 'Satara' },
  { name: 'Pratapgad', marathiName: 'प्रतापगड', taluka: 'Mahabaleshwar', district: 'Satara' },
  { name: 'Avakali', marathiName: 'अवकळी', taluka: 'Mahabaleshwar', district: 'Satara' },
  { name: 'Machutar', marathiName: 'माचुतर', taluka: 'Mahabaleshwar', district: 'Satara' },

  // Jaoli / Medha Taluka Villages
  { name: 'Medha', marathiName: 'मेढा', taluka: 'Jaoli', district: 'Satara' },
  { name: 'Kudal Jaoli', marathiName: 'कुडाळ', taluka: 'Jaoli', district: 'Satara' },
  { name: 'Bamnoli Satara', marathiName: 'बामणोली (कास तलाव)', taluka: 'Jaoli', district: 'Satara' },
  { name: 'Mahu', marathiName: 'महु', taluka: 'Jaoli', district: 'Satara' },
  { name: 'Anewadi', marathiName: 'आनेवाडी (टोल नाका)', taluka: 'Jaoli', district: 'Satara' },
  { name: 'Kelghar', marathiName: 'केळघर', taluka: 'Jaoli', district: 'Satara' },
  { name: 'Kedambe', marathiName: 'केदंबे', taluka: 'Jaoli', district: 'Satara' },
  { name: 'Saygaon', marathiName: 'सायगाव', taluka: 'Jaoli', district: 'Satara' },
  { name: 'Kas Pathar', marathiName: 'कास पठार / गाव', taluka: 'Jaoli', district: 'Satara', aliases: ['Kas'] },
  { name: 'Kusumbi', marathiName: 'कुसुंबी', taluka: 'Jaoli', district: 'Satara' },
];

/**
 * Searches villages across Kolhapur, Sangli, and Satara.
 * Prioritizes:
 *  1. Exact prefix match on name (e.g. query "va" -> "Vadgaon", "Vaduj", "Valva")
 *  2. Alias prefix match (e.g. "Vadgaon" for "Peth Vadgaon")
 *  3. V/W Marathi transliteration variants (e.g. "va" matches "Vita", "Walwa", "Wai")
 *  4. Word-starts-with match (e.g. "Peth Vadgaon" for "va")
 *  5. General substring match in name or Marathi name
 */
export function searchMaharashtraVillages(query: string, limit = 20): VillageLocation[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) {
    return [];
  }

  // Generate Marathi/English transliteration variants (e.g. 'v' <-> 'w', and vowel variants like 'va' <-> 'vi')
  const altPrefixes: string[] = [];
  if (cleanQ.startsWith('v')) {
    altPrefixes.push('w' + cleanQ.slice(1));
    if (cleanQ.startsWith('va')) {
      altPrefixes.push('vi' + cleanQ.slice(2));
      altPrefixes.push('wi' + cleanQ.slice(2));
    } else if (cleanQ.startsWith('vi')) {
      altPrefixes.push('va' + cleanQ.slice(2));
      altPrefixes.push('wa' + cleanQ.slice(2));
    }
  } else if (cleanQ.startsWith('w')) {
    altPrefixes.push('v' + cleanQ.slice(1));
    if (cleanQ.startsWith('wa')) {
      altPrefixes.push('va' + cleanQ.slice(2));
      altPrefixes.push('vi' + cleanQ.slice(2));
    } else if (cleanQ.startsWith('wi')) {
      altPrefixes.push('vi' + cleanQ.slice(2));
      altPrefixes.push('va' + cleanQ.slice(2));
    }
  }

  const prefixMatches: VillageLocation[] = [];
  const aliasPrefixMatches: VillageLocation[] = [];
  const phoneticVariantMatches: VillageLocation[] = [];
  const wordStartMatches: VillageLocation[] = [];
  const substringMatches: VillageLocation[] = [];
  const seen = new Set<string>();

  for (const item of MAHARASHTRA_VILLAGES) {
    const nameLower = item.name.toLowerCase();
    const marathi = item.marathiName || '';
    const aliasesLower = (item.aliases || []).map(a => a.toLowerCase());
    const key = `${item.name}-${item.district}`;

    // 1. Direct name starts with query
    if (nameLower.startsWith(cleanQ)) {
      prefixMatches.push(item);
      seen.add(key);
      continue;
    }

    // 2. An alias starts with query (e.g. "vadgaon" for "Peth Vadgaon")
    if (aliasesLower.some(a => a.startsWith(cleanQ))) {
      aliasPrefixMatches.push(item);
      seen.add(key);
      continue;
    }

    // 3. Word in name starts with query (e.g. "Peth Vadgaon" for "va")
    const words = nameLower.split(/\s+/);
    if (words.some(w => w.startsWith(cleanQ))) {
      wordStartMatches.push(item);
      seen.add(key);
      continue;
    }

    // 4. Phonetic V/W variant starts with query (e.g. "va" matching "Vita", "Walwa", "Wai")
    if (altPrefixes.some(alt => nameLower.startsWith(alt) || aliasesLower.some(a => a.startsWith(alt)))) {
      phoneticVariantMatches.push(item);
      seen.add(key);
      continue;
    }

    // 5. Substring match in name, aliases, or Marathi name
    if (
      nameLower.includes(cleanQ) ||
      aliasesLower.some(a => a.includes(cleanQ)) ||
      marathi.toLowerCase().includes(cleanQ)
    ) {
      substringMatches.push(item);
      seen.add(key);
    }
  }

  // Prioritize popular / major centers first, then alphabetically
  const isPopularLoc = (loc: VillageLocation) => {
    if (POPULAR_NEARBY_CENTERS.includes(loc.name)) return true;
    if (loc.aliases && loc.aliases.some((a) => POPULAR_NEARBY_CENTERS.includes(a))) return true;
    return false;
  };

  const sortPriority = (a: VillageLocation, b: VillageLocation) => {
    const popA = isPopularLoc(a) ? 0 : 1;
    const popB = isPopularLoc(b) ? 0 : 1;
    if (popA !== popB) return popA - popB;
    return a.name.localeCompare(b.name);
  };

  prefixMatches.sort(sortPriority);
  aliasPrefixMatches.sort(sortPriority);
  wordStartMatches.sort(sortPriority);
  phoneticVariantMatches.sort(sortPriority);
  substringMatches.sort(sortPriority);

  const combined = [
    ...prefixMatches,
    ...aliasPrefixMatches,
    ...wordStartMatches,
    ...phoneticVariantMatches,
    ...substringMatches,
  ];

  return combined.slice(0, limit);
}

/**
 * Formats a selected location name for display and saving.
 * E.g., "Peth Vadgaon" or "Vita (Sangli)" if disambiguation is helpful,
 * but defaults to clean English town/village name so medical records remain concise.
 */
export function formatVillageName(location: VillageLocation): string {
  return location.name;
}
