import { useState, useCallback, useMemo } from "react";

// ============================================================
// COMPLETE ADR DANGEROUS GOODS DATABASE - ALL 9 CLASSES
// Transport categories & multipliers per ADR 1.1.3.6.4:
//   Cat 0 = no exemption (full ADR always)
//   Cat 1 = factor 50, max 20 kg/L
//   Cat 1a = factor 20 (specific UN nos.)
//   Cat 2 = factor 3,  max 333 kg/L
//   Cat 3 = factor 1,  max 1000 kg/L
//   Cat 4 = factor 0,  unlimited
// ============================================================

const DG_DATABASE = [
  // === CLASS 1: EXPLOSIVES ===
  { un: "UN0336", name: "FIREWORKS", nameNo: "Fyrverkeri (1.4G)", class: "1", division: "1.4", pg: "II", cat: 2, label: "1.4", tunnel: "(E)", sp: "S1.4G", pi: "P135" },
  { un: "UN0337", name: "FIREWORKS", nameNo: "Fyrverkeri (1.4S)", class: "1", division: "1.4", pg: "", cat: 4, label: "1.4", tunnel: "(E)", sp: "S1.4S", pi: "P135" },
  { un: "UN0333", name: "FIREWORKS", nameNo: "Fyrverkeri (1.1G)", class: "1", division: "1.1", pg: "", cat: 0, label: "1.1", tunnel: "(B1000C)", sp: "S1.1G", pi: "P135" },
  { un: "UN0335", name: "FIREWORKS", nameNo: "Fyrverkeri (1.3G)", class: "1", division: "1.3", pg: "", cat: 0, label: "1.3", tunnel: "(C5000D)", sp: "S1.3G", pi: "P135" },
  { un: "UN0012", name: "CARTRIDGES FOR WEAPONS, INERT PROJECTILE", nameNo: "Patroner med inert prosjektil", class: "1", division: "1.4", pg: "", cat: 2, label: "1.4S", tunnel: "(E)", sp: "S1.4S", pi: "P130" },
  { un: "UN0014", name: "CARTRIDGES FOR WEAPONS, BLANK", nameNo: "Løspatroner", class: "1", division: "1.4", pg: "", cat: 2, label: "1.4S", tunnel: "(E)", sp: "S1.4S", pi: "P130" },
  { un: "UN0323", name: "CARTRIDGES, POWER DEVICE", nameNo: "Patroner, drivmiddel", class: "1", division: "1.4", pg: "", cat: 2, label: "1.4S", tunnel: "(E)", sp: "", pi: "P134" },
  { un: "UN0431", name: "ARTICLES, PYROTECHNIC", nameNo: "Pyrotekniske artikler", class: "1", division: "1.4", pg: "", cat: 2, label: "1.4G", tunnel: "(E)", sp: "", pi: "P135" },
  { un: "UN0349", name: "ARTICLES, EXPLOSIVE, N.O.S.", nameNo: "Eksplosive artikler, I.A.N.", class: "1", division: "1.4", pg: "", cat: 2, label: "1.4S", tunnel: "(E)", sp: "274", pi: "P101" },

  // === CLASS 2: GASES ===
  { un: "UN1011", name: "BUTANE", nameNo: "Butan", class: "2", division: "2.1", pg: "", cat: 2, label: "2.1", tunnel: "(B/D)", sp: "", pi: "P200" },
  { un: "UN1049", name: "HYDROGEN, COMPRESSED", nameNo: "Hydrogen, komprimert", class: "2", division: "2.1", pg: "", cat: 2, label: "2.1", tunnel: "(B/D)", sp: "", pi: "P200" },
  { un: "UN1066", name: "NITROGEN, COMPRESSED", nameNo: "Nitrogen, komprimert", class: "2", division: "2.2", pg: "", cat: 3, label: "2.2", tunnel: "(E)", sp: "", pi: "P200" },
  { un: "UN1013", name: "CARBON DIOXIDE", nameNo: "Karbondioksid", class: "2", division: "2.2", pg: "", cat: 3, label: "2.2", tunnel: "(E)", sp: "", pi: "P200" },
  { un: "UN1072", name: "OXYGEN, COMPRESSED", nameNo: "Oksygen, komprimert", class: "2", division: "2.2", pg: "", cat: 3, label: "2.2+5.1", tunnel: "(E)", sp: "", pi: "P200" },
  { un: "UN1978", name: "PROPANE", nameNo: "Propan", class: "2", division: "2.1", pg: "", cat: 2, label: "2.1", tunnel: "(B/D)", sp: "", pi: "P200" },
  { un: "UN1950", name: "AEROSOLS", nameNo: "Aerosoler", class: "2", division: "2.1", pg: "", cat: 3, label: "2.1", tunnel: "(E)", sp: "190, 327, 344, 625", pi: "P207/LP200" },
  { un: "UN1965", name: "HYDROCARBON GAS MIXTURE, LIQUEFIED, N.O.S.", nameNo: "Hydrokarbongassblanding, flytende", class: "2", division: "2.1", pg: "", cat: 2, label: "2.1", tunnel: "(B/D)", sp: "", pi: "P200" },
  { un: "UN1044", name: "FIRE EXTINGUISHERS", nameNo: "Brannslukkeapparat", class: "2", division: "2.2", pg: "", cat: 3, label: "2.2", tunnel: "(E)", sp: "225, 594", pi: "P003/LP200" },
  { un: "UN1956", name: "COMPRESSED GAS, N.O.S.", nameNo: "Komprimert gass, I.A.N.", class: "2", division: "2.2", pg: "", cat: 3, label: "2.2", tunnel: "(E)", sp: "274", pi: "P200" },
  { un: "UN1954", name: "COMPRESSED GAS, FLAMMABLE, N.O.S.", nameNo: "Komprimert gass, brannfarlig, I.A.N.", class: "2", division: "2.1", pg: "", cat: 2, label: "2.1", tunnel: "(B/D)", sp: "274", pi: "P200" },
  { un: "UN1955", name: "COMPRESSED GAS, TOXIC, N.O.S.", nameNo: "Komprimert gass, giftig, I.A.N.", class: "2", division: "2.3", pg: "", cat: 1, label: "2.3", tunnel: "(C/D)", sp: "274", pi: "P200" },
  { un: "UN2037", name: "RECEPTACLES, SMALL, CONTAINING GAS (GAS CARTRIDGES)", nameNo: "Gassbeholdere, små (gasspatroner)", class: "2", division: "2.1", pg: "", cat: 3, label: "2.1", tunnel: "(E)", sp: "", pi: "P207/LP200" },

  // === CLASS 3: FLAMMABLE LIQUIDS ===
  { un: "UN1090", name: "ACETONE", nameNo: "Aceton", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1170", name: "ETHANOL (ETHYL ALCOHOL)", nameNo: "Etanol (etylalkohol)", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "144", pi: "P001" },
  { un: "UN1173", name: "ETHYL ACETATE", nameNo: "Etylacetat", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1203", name: "GASOLINE (PETROL)", nameNo: "Bensin", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1202", name: "DIESEL FUEL", nameNo: "Diesel", class: "3", division: "", pg: "III", cat: 3, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1263", name: "PAINT", nameNo: "Maling (inkl. lakk, emalje, beis)", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "163, 367", pi: "P001" },
  { un: "UN1266", name: "PERFUMERY PRODUCTS", nameNo: "Parfymeprodukter", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1300", name: "TURPENTINE SUBSTITUTE", nameNo: "Terpentinerstatning", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1219", name: "ISOPROPANOL (ISOPROPYL ALCOHOL)", nameNo: "Isopropanol", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1993", name: "FLAMMABLE LIQUID, N.O.S. (PG I)", nameNo: "Brannfarlig væske, I.A.N. (EG I)", class: "3", division: "", pg: "I", cat: 1, label: "3", tunnel: "(C/E)", sp: "274", pi: "P001" },
  { un: "UN1993", name: "FLAMMABLE LIQUID, N.O.S. (PG II)", nameNo: "Brannfarlig væske, I.A.N. (EG II)", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "274", pi: "P001" },
  { un: "UN1993", name: "FLAMMABLE LIQUID, N.O.S. (PG III)", nameNo: "Brannfarlig væske, I.A.N. (EG III)", class: "3", division: "", pg: "III", cat: 3, label: "3", tunnel: "(D/E)", sp: "274", pi: "P001" },
  { un: "UN1268", name: "PETROLEUM DISTILLATES, N.O.S.", nameNo: "Petroleumsdestillater, I.A.N.", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1210", name: "PRINTING INK", nameNo: "Trykkfarge", class: "3", division: "", pg: "III", cat: 3, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1169", name: "EXTRACTS, AROMATIC, LIQUID", nameNo: "Aromatiske ekstrakter, flytende", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1230", name: "METHANOL", nameNo: "Metanol", class: "3", division: "", pg: "II", cat: 2, label: "3+6.1", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1294", name: "TOLUENE", nameNo: "Toluen", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1307", name: "XYLENES", nameNo: "Xylener", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN2056", name: "TETRAHYDROFURAN", nameNo: "Tetrahydrofuran", class: "3", division: "", pg: "II", cat: 2, label: "3", tunnel: "(D/E)", sp: "", pi: "P001" },

  // === CLASS 4.1: FLAMMABLE SOLIDS ===
  { un: "UN1325", name: "FLAMMABLE SOLID, ORGANIC, N.O.S.", nameNo: "Brannfarlig fast stoff, organisk, I.A.N.", class: "4.1", division: "", pg: "II", cat: 2, label: "4.1", tunnel: "(E)", sp: "274", pi: "P002" },
  { un: "UN1331", name: "MATCHES, STRIKE ANYWHERE", nameNo: "Fyrstikker, stryke-hvor-som-helst", class: "4.1", division: "", pg: "III", cat: 3, label: "4.1", tunnel: "(E)", sp: "", pi: "P407" },
  { un: "UN1944", name: "MATCHES, SAFETY", nameNo: "Sikkerhetsfyrstikker", class: "4.1", division: "", pg: "III", cat: 3, label: "4.1", tunnel: "(E)", sp: "", pi: "P407" },
  { un: "UN3175", name: "SOLIDS CONTAINING FLAMMABLE LIQUID, N.O.S.", nameNo: "Fast stoff med brannfarlig væske, I.A.N.", class: "4.1", division: "", pg: "II", cat: 2, label: "4.1", tunnel: "(E)", sp: "274", pi: "P002" },
  { un: "UN3221", name: "SELF-REACTIVE LIQUID TYPE B", nameNo: "Selvreaktiv væske type B", class: "4.1", division: "", pg: "", cat: 1, label: "4.1+1", tunnel: "(C/D)", sp: "", pi: "P520" },

  // === CLASS 4.2: SPONTANEOUSLY COMBUSTIBLE ===
  { un: "UN2845", name: "PYROPHORIC LIQUID, ORGANIC, N.O.S.", nameNo: "Pyrofor væske, organisk, I.A.N.", class: "4.2", division: "", pg: "I", cat: 0, label: "4.2", tunnel: "(B/E)", sp: "274", pi: "P400" },
  { un: "UN1373", name: "FIBRES, ANIMAL or VEGETABLE with oil", nameNo: "Fibrer med olje", class: "4.2", division: "", pg: "III", cat: 2, label: "4.2", tunnel: "(D/E)", sp: "", pi: "P407" },
  { un: "UN3190", name: "SELF-HEATING SOLID, INORGANIC, N.O.S.", nameNo: "Selvoppvarmende fast stoff, uorganisk, I.A.N.", class: "4.2", division: "", pg: "II", cat: 2, label: "4.2", tunnel: "(D/E)", sp: "274", pi: "P002" },
  { un: "UN3183", name: "SELF-HEATING LIQUID, ORGANIC, N.O.S.", nameNo: "Selvoppvarmende væske, organisk, I.A.N.", class: "4.2", division: "", pg: "II", cat: 2, label: "4.2", tunnel: "(D/E)", sp: "274", pi: "P001" },

  // === CLASS 4.3: DANGEROUS WHEN WET ===
  { un: "UN1428", name: "SODIUM", nameNo: "Natrium", class: "4.3", division: "", pg: "I", cat: 1, label: "4.3", tunnel: "(B/E)", sp: "", pi: "P403" },
  { un: "UN2813", name: "WATER-REACTIVE SOLID, N.O.S.", nameNo: "Vannreaktivt fast stoff, I.A.N.", class: "4.3", division: "", pg: "I", cat: 1, label: "4.3", tunnel: "(B/E)", sp: "274", pi: "P403" },
  { un: "UN1402", name: "CALCIUM CARBIDE", nameNo: "Kalsiumkarbid", class: "4.3", division: "", pg: "I", cat: 1, label: "4.3", tunnel: "(B/E)", sp: "", pi: "P403" },
  { un: "UN1415", name: "LITHIUM", nameNo: "Litium (metall)", class: "4.3", division: "", pg: "I", cat: 1, label: "4.3+4.2", tunnel: "(B/E)", sp: "", pi: "P403" },
  { un: "UN3148", name: "WATER-REACTIVE LIQUID, N.O.S.", nameNo: "Vannreaktiv væske, I.A.N.", class: "4.3", division: "", pg: "I", cat: 1, label: "4.3", tunnel: "(B/E)", sp: "274", pi: "P001" },

  // === CLASS 5.1: OXIDIZERS ===
  { un: "UN1942", name: "AMMONIUM NITRATE", nameNo: "Ammoniumnitrat", class: "5.1", division: "", pg: "III", cat: 3, label: "5.1", tunnel: "(E)", sp: "", pi: "P002" },
  { un: "UN2014", name: "HYDROGEN PEROXIDE, AQUEOUS SOLUTION", nameNo: "Hydrogenperoksid, vandig løsning", class: "5.1", division: "", pg: "II", cat: 2, label: "5.1+8", tunnel: "(D/E)", sp: "", pi: "P504" },
  { un: "UN1486", name: "POTASSIUM NITRATE", nameNo: "Kaliumnitrat", class: "5.1", division: "", pg: "III", cat: 3, label: "5.1", tunnel: "(E)", sp: "", pi: "P002" },
  { un: "UN1495", name: "SODIUM CHLORATE", nameNo: "Natriumklorat", class: "5.1", division: "", pg: "II", cat: 2, label: "5.1", tunnel: "(D/E)", sp: "", pi: "P002" },
  { un: "UN2067", name: "AMMONIUM NITRATE BASED FERTILISER", nameNo: "Gjødsel basert på ammoniumnitrat", class: "5.1", division: "", pg: "III", cat: 3, label: "5.1", tunnel: "(E)", sp: "186, 611", pi: "P002" },
  { un: "UN3139", name: "OXIDIZING LIQUID, N.O.S.", nameNo: "Oksiderende væske, I.A.N.", class: "5.1", division: "", pg: "I", cat: 1, label: "5.1", tunnel: "(B/E)", sp: "274", pi: "P504" },
  { un: "UN1479", name: "OXIDIZING SOLID, N.O.S.", nameNo: "Oksiderende fast stoff, I.A.N.", class: "5.1", division: "", pg: "I", cat: 1, label: "5.1", tunnel: "(B/E)", sp: "274", pi: "P002" },

  // === CLASS 5.2: ORGANIC PEROXIDES ===
  { un: "UN3101", name: "ORGANIC PEROXIDE TYPE B, LIQUID", nameNo: "Organisk peroksid type B, væske", class: "5.2", division: "", pg: "", cat: 1, label: "5.2+1", tunnel: "(C/D)", sp: "", pi: "P520" },
  { un: "UN3105", name: "ORGANIC PEROXIDE TYPE D, LIQUID", nameNo: "Organisk peroksid type D, væske", class: "5.2", division: "", pg: "", cat: 2, label: "5.2", tunnel: "(D/E)", sp: "", pi: "P520" },
  { un: "UN3109", name: "ORGANIC PEROXIDE TYPE F, LIQUID", nameNo: "Organisk peroksid type F, væske", class: "5.2", division: "", pg: "", cat: 2, label: "5.2", tunnel: "(D/E)", sp: "", pi: "P520" },

  // === CLASS 6.1: TOXIC SUBSTANCES ===
  { un: "UN2810", name: "TOXIC LIQUID, ORGANIC, N.O.S.", nameNo: "Giftig væske, organisk, I.A.N.", class: "6.1", division: "", pg: "I", cat: 1, label: "6.1", tunnel: "(C/D)", sp: "274", pi: "P001" },
  { un: "UN2811", name: "TOXIC SOLID, ORGANIC, N.O.S.", nameNo: "Giftig fast stoff, organisk, I.A.N.", class: "6.1", division: "", pg: "I", cat: 1, label: "6.1", tunnel: "(C/D)", sp: "274", pi: "P002" },
  { un: "UN1593", name: "DICHLOROMETHANE", nameNo: "Diklormetan", class: "6.1", division: "", pg: "III", cat: 2, label: "6.1", tunnel: "(E)", sp: "", pi: "P001" },
  { un: "UN2903", name: "PESTICIDE, LIQUID, TOXIC, N.O.S.", nameNo: "Plantevernmiddel, væske, giftig, I.A.N.", class: "6.1", division: "", pg: "I", cat: 1, label: "6.1", tunnel: "(C/D)", sp: "61, 274", pi: "P001" },

  // === CLASS 6.2: INFECTIOUS SUBSTANCES ===
  { un: "UN2814", name: "INFECTIOUS SUBSTANCE, AFFECTING HUMANS", nameNo: "Smittefarlig stoff, mennesker", class: "6.2", division: "", pg: "", cat: 0, label: "6.2", tunnel: "(E)", sp: "318", pi: "P620" },
  { un: "UN2900", name: "INFECTIOUS SUBSTANCE, AFFECTING ANIMALS", nameNo: "Smittefarlig stoff, dyr", class: "6.2", division: "", pg: "", cat: 0, label: "6.2", tunnel: "(E)", sp: "318", pi: "P620" },
  { un: "UN3291", name: "CLINICAL WASTE, UNSPECIFIED, N.O.S.", nameNo: "Klinisk avfall, uspesifisert", class: "6.2", division: "", pg: "II", cat: 2, label: "6.2", tunnel: "(E)", sp: "", pi: "P621" },
  { un: "UN3373", name: "BIOLOGICAL SUBSTANCE, CATEGORY B", nameNo: "Biologisk stoff, kategori B", class: "6.2", division: "", pg: "", cat: 4, label: "6.2", tunnel: "(E)", sp: "319", pi: "P650" },

  // === CLASS 7: RADIOACTIVE ===
  { un: "UN2908", name: "RADIOACTIVE MATERIAL, EXCEPTED PACKAGE", nameNo: "Radioaktivt materiale, fritatt kolli", class: "7", division: "", pg: "", cat: 4, label: "7", tunnel: "(E)", sp: "290", pi: "See 7" },
  { un: "UN2915", name: "RADIOACTIVE MATERIAL, TYPE A PACKAGE", nameNo: "Radioaktivt materiale, type A kolli", class: "7", division: "", pg: "", cat: 0, label: "7A/7B/7C", tunnel: "(E)", sp: "", pi: "See 7" },

  // === CLASS 8: CORROSIVE SUBSTANCES ===
  { un: "UN1789", name: "HYDROCHLORIC ACID", nameNo: "Saltsyre", class: "8", division: "", pg: "II", cat: 2, label: "8", tunnel: "(E)", sp: "", pi: "P001" },
  { un: "UN1823", name: "SODIUM HYDROXIDE, SOLID", nameNo: "Natriumhydroksid, fast", class: "8", division: "", pg: "II", cat: 2, label: "8", tunnel: "(E)", sp: "", pi: "P002" },
  { un: "UN1824", name: "SODIUM HYDROXIDE SOLUTION", nameNo: "Natriumhydroksidløsning (lut)", class: "8", division: "", pg: "II", cat: 2, label: "8", tunnel: "(E)", sp: "", pi: "P001" },
  { un: "UN2796", name: "SULPHURIC ACID (max 51%)", nameNo: "Svovelsyre (maks 51%)", class: "8", division: "", pg: "II", cat: 2, label: "8", tunnel: "(E)", sp: "", pi: "P001" },
  { un: "UN1830", name: "SULPHURIC ACID (>51%)", nameNo: "Svovelsyre (>51%)", class: "8", division: "", pg: "II", cat: 2, label: "8", tunnel: "(E)", sp: "", pi: "P001" },
  { un: "UN2794", name: "BATTERIES, WET, FILLED WITH ACID", nameNo: "Batterier, våte, syrefylte", class: "8", division: "", pg: "III", cat: 3, label: "8", tunnel: "(E)", sp: "295", pi: "P801" },
  { un: "UN2795", name: "BATTERIES, WET, FILLED WITH ALKALI", nameNo: "Batterier, våte, alkalifylte", class: "8", division: "", pg: "III", cat: 3, label: "8", tunnel: "(E)", sp: "295", pi: "P801" },
  { un: "UN2031", name: "NITRIC ACID", nameNo: "Salpetersyre", class: "8", division: "", pg: "II", cat: 2, label: "8+5.1", tunnel: "(D/E)", sp: "", pi: "P001" },
  { un: "UN1805", name: "PHOSPHORIC ACID SOLUTION", nameNo: "Fosforsyreløsning", class: "8", division: "", pg: "III", cat: 3, label: "8", tunnel: "(E)", sp: "", pi: "P001" },
  { un: "UN1760", name: "CORROSIVE LIQUID, N.O.S.", nameNo: "Etsende væske, I.A.N.", class: "8", division: "", pg: "I", cat: 1, label: "8", tunnel: "(C/E)", sp: "274", pi: "P001" },
  { un: "UN1759", name: "CORROSIVE SOLID, N.O.S.", nameNo: "Etsende fast stoff, I.A.N.", class: "8", division: "", pg: "I", cat: 1, label: "8", tunnel: "(C/E)", sp: "274", pi: "P002" },
  { un: "UN1791", name: "HYPOCHLORITE SOLUTION", nameNo: "Hypoklorittløsning (blekemiddel)", class: "8", division: "", pg: "III", cat: 3, label: "8", tunnel: "(E)", sp: "", pi: "P001" },
  { un: "UN2797", name: "BATTERY FLUID, ACID", nameNo: "Batterivæske, syre", class: "8", division: "", pg: "II", cat: 2, label: "8", tunnel: "(E)", sp: "", pi: "P001" },

  // === CLASS 9: MISCELLANEOUS ===
  { un: "UN3480", name: "LITHIUM ION BATTERIES", nameNo: "Litiumionbatterier", class: "9", division: "", pg: "", cat: 2, label: "9A", tunnel: "(E)", sp: "188, 230, 310, 348, 376, 636", pi: "P903/LP903" },
  { un: "UN3481", name: "LITHIUM ION BATTERIES PACKED WITH / CONTAINED IN EQUIPMENT", nameNo: "Litiumionbatterier pakket med/i utstyr", class: "9", division: "", pg: "", cat: 2, label: "9A", tunnel: "(E)", sp: "188, 230, 310, 348, 376, 636", pi: "P903/LP903" },
  { un: "UN3090", name: "LITHIUM METAL BATTERIES", nameNo: "Litiummetallbatterier", class: "9", division: "", pg: "", cat: 2, label: "9A", tunnel: "(E)", sp: "188, 230, 310, 636", pi: "P903/LP903" },
  { un: "UN3091", name: "LITHIUM METAL BATTERIES PACKED WITH / CONTAINED IN EQUIPMENT", nameNo: "Litiummetallbatterier pakket med/i utstyr", class: "9", division: "", pg: "", cat: 2, label: "9A", tunnel: "(E)", sp: "188, 230, 310, 636", pi: "P903/LP903" },
  { un: "UN3171", name: "BATTERY-POWERED VEHICLE or EQUIPMENT", nameNo: "Batteridrevet kjøretøy/utstyr", class: "9", division: "", pg: "", cat: 3, label: "9A", tunnel: "(E)", sp: "240, 312, 388", pi: "P907" },
  { un: "UN3082", name: "ENVIRONMENTALLY HAZARDOUS SUBSTANCE, LIQUID, N.O.S.", nameNo: "Miljøfarlig stoff, væske, I.A.N.", class: "9", division: "", pg: "III", cat: 3, label: "9", tunnel: "(E)", sp: "274, 331, 335, 375", pi: "P001" },
  { un: "UN3077", name: "ENVIRONMENTALLY HAZARDOUS SUBSTANCE, SOLID, N.O.S.", nameNo: "Miljøfarlig stoff, fast, I.A.N.", class: "9", division: "", pg: "III", cat: 3, label: "9", tunnel: "(E)", sp: "274, 335, 375", pi: "P002" },
  { un: "UN3268", name: "SAFETY DEVICES, electrically initiated", nameNo: "Sikkerhetsutstyr, elektrisk utløst", class: "9", division: "", pg: "", cat: 2, label: "9", tunnel: "(E)", sp: "235", pi: "P006" },
  { un: "UN3166", name: "VEHICLE, FUEL CELL, FLAMMABLE GAS POWERED", nameNo: "Kjøretøy, brenselcelle, gass", class: "9", division: "", pg: "", cat: 3, label: "9", tunnel: "(E)", sp: "312", pi: "P907" },
  { un: "UN3363", name: "DANGEROUS GOODS IN MACHINERY / APPARATUS", nameNo: "Farlig gods i maskineri/apparat", class: "9", division: "", pg: "", cat: 3, label: "9", tunnel: "(E)", sp: "301, 672", pi: "P006" },
  { un: "UN3316", name: "CHEMICAL KIT / FIRST AID KIT", nameNo: "Kjemikalie-sett / førstehjelpssett", class: "9", division: "", pg: "II", cat: 2, label: "9", tunnel: "(E)", sp: "251, 340", pi: "P900" },
  { un: "UN1845", name: "DRY ICE (CARBON DIOXIDE, SOLID)", nameNo: "Tørris (karbondioksid, fast)", class: "9", division: "", pg: "", cat: 3, label: "9", tunnel: "(E)", sp: "951", pi: "P904" },
];

const CAT_MULTIPLIERS = { 0: Infinity, 1: 50, 2: 3, 3: 1, 4: 0 };
const CAT_LABELS = { 0:"Kat. 0 – Ingen fritak", 1:"Kat. 1 – ×50 (maks 20)", 2:"Kat. 2 – ×3 (maks 333)", 3:"Kat. 3 – ×1 (maks 1000)", 4:"Kat. 4 – ×0 (ubegrenset)" };
const PG_INFO = { "I":"EG I – Stor fare (strengeste emballasje, X-merket)", "II":"EG II – Middels fare (Y-merket emballasje)", "III":"EG III – Lav fare (Z-merket emballasje)", "":"Ikke tildelt emballasjegruppe" };
const PG_CLASSES_WITHOUT = ["2","5.2","6.2","7"]; // Classes that don't use packing groups
const CLASS_NAMES = { "1":"Eksplosiver","2":"Gasser","3":"Brannfarlige væsker","4.1":"Brannfarlige faste stoffer","4.2":"Selvantennelig","4.3":"Vannreaktive","5.1":"Oksiderende","5.2":"Organiske peroksider","6.1":"Giftige stoffer","6.2":"Smittefarlige","7":"Radioaktivt","8":"Etsende","9":"Diverse farlig gods" };
const CLASS_COLORS = { "1":"#e74c3c","2":"#27ae60","3":"#e74c3c","4.1":"#e74c3c","4.2":"#d35400","4.3":"#2980b9","5.1":"#f39c12","5.2":"#e67e22","6.1":"#8e44ad","6.2":"#8e44ad","7":"#f1c40f","8":"#1abc9c","9":"#34495e" };
const TRANSPORT_CODES = ["A","B","C","D","E","F","G","H","I","K","L","M"];

function today() { return new Date().toISOString().split("T")[0]; }
function genId() { let s=""; for(let i=0;i<10;i++) s+=Math.floor(Math.random()*10); return s; }
function calcPoints(cat, qty) { return cat===0?Infinity:qty*(CAT_MULTIPLIERS[cat]??1); }

// ===================== ADR HAZARD LABEL COLORS =====================
const LABEL_COLORS = {
  "1":"#e67e22","1.1":"#e67e22","1.2":"#e67e22","1.3":"#e67e22","1.4":"#e67e22","1.5":"#e67e22","1.6":"#e67e22",
  "2.1":"#e74c3c","2.2":"#27ae60","2.3":"#fff",
  "3":"#e74c3c","4.1":"#fff","4.2":"#fff","4.3":"#3498db",
  "5.1":"#f1c40f","5.2":"#f1c40f",
  "6.1":"#fff","6.2":"#fff","7":"#f1c40f","8":"#fff","9":"#fff",
};
const LABEL_SYMBOLS = {
  "1":"💥","2.1":"🔥","2.2":"⛽","2.3":"☠","3":"🔥","4.1":"🔥","4.2":"🔥","4.3":"💧",
  "5.1":"⭕","5.2":"🔥","6.1":"☠","6.2":"☣","7":"☢","8":"🧪","9":"⚠",
};
const LITHIUM_UNS = ["UN3480","UN3481","UN3090","UN3091"];

// ===================== SVG HAZARD DIAMOND =====================
function HazardDiamondSVG({ classNum, size = 100, label }) {
  const cls = classNum.includes(".") ? classNum : classNum;
  const bg = LABEL_COLORS[cls] || "#fff";
  const darkBg = ["#e74c3c","#e67e22","#3498db","#27ae60","#f1c40f"].includes(bg);
  const textColor = darkBg ? "#fff" : "#000";
  const half = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${half},${half}) rotate(45)`}>
        <rect x={-half*0.7} y={-half*0.7} width={half*1.4} height={half*1.4} fill={bg} stroke="#000" strokeWidth="2"/>
        <rect x={-half*0.62} y={-half*0.62} width={half*1.24} height={half*1.24} fill="none" stroke="#000" strokeWidth="1"/>
      </g>
      <text x={half} y={half-size*0.08} textAnchor="middle" fontSize={size*0.28} fontWeight="900" fill={textColor} dominantBaseline="central">
        {LABEL_SYMBOLS[cls] || "⚠"}
      </text>
      <text x={half} y={size*0.82} textAnchor="middle" fontSize={size*0.16} fontWeight="900" fill="#000" dominantBaseline="central">
        {classNum}
      </text>
      {label && <text x={half} y={half+size*0.12} textAnchor="middle" fontSize={size*0.07} fontWeight="700" fill={textColor}>{label}</text>}
    </svg>
  );
}

// ===================== PRINT CONFIG SCREEN =====================
function PrintConfig({ data, onBack, onPrint }) {
  const [copies, setCopies] = useState({ avsender: true, transportor: true, mottaker: true, ekstra: false });
  const [labels, setLabels] = useState({ hazardDiamond: true, unLabel: true, lithiumLabel: true, orientationArrows: false });
  const [labelCount, setLabelCount] = useState(1);

  const hasLithium = data.dgItems.some(i => LITHIUM_UNS.includes(i.un));
  const hasLiquids = data.dgItems.some(i => ["3","5.1","5.2","6.1","8"].includes(i.class) || (i.pg && ["I","II"].includes(i.pg)));
  const uniqueClasses = [...new Set(data.dgItems.map(i => i.class))];
  const uniqueUNs = [...new Set(data.dgItems.map(i => i.un))];

  const copyNames = { avsender: "Avsender (original)", transportor: "Transportør", mottaker: "Mottaker", ekstra: "Ekstra kopi" };
  const labelNames = {
    hazardDiamond: `ADR-fareseddel (diamant) – ${uniqueClasses.length} klasse(r)`,
    unLabel: `UN-nummer-etikett – ${uniqueUNs.length} UN-nr.`,
    lithiumLabel: "Lithiumbatteri-etikett",
    orientationArrows: "Orienteringspiler (for væsker)",
  };

  const totalPages = Object.values(copies).filter(Boolean).length + (Object.values(labels).some(Boolean) ? labelCount : 0);

  return (
    <div style={{fontFamily:"'Segoe UI',sans-serif",minHeight:"100vh",background:"#f0f0ea",color:"#1a1a2e"}}>
      <div style={{background:"linear-gradient(135deg,#1a1a2e,#0f3460)",color:"#fff",padding:"20px 28px",display:"flex",alignItems:"center",gap:14}}>
        <span style={{fontSize:24}}>⎙</span>
        <div><div style={{fontSize:20,fontWeight:900}}>Utskriftskonfigurasjon</div><div style={{fontSize:12,opacity:0.6}}>Velg kopier og faremerker</div></div>
      </div>
      <div style={{maxWidth:700,margin:"0 auto",padding:"24px 16px"}}>
        {/* Copies */}
        <div style={{background:"#fff",borderRadius:10,padding:"20px 24px",marginBottom:16,border:"1px solid #e4e4dc"}}>
          <div style={{fontSize:15,fontWeight:800,marginBottom:14}}>Fraktbrev-kopier</div>
          <div style={{display:"grid",gap:10}}>
            {Object.entries(copyNames).map(([k,v])=>(
              <label key={k} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"8px 12px",borderRadius:6,background:copies[k]?"#eafaf1":"#fafaf8",border:`1.5px solid ${copies[k]?"#27ae60":"#ddd"}`,transition:"all 0.15s"}}>
                <input type="checkbox" checked={copies[k]} onChange={e=>setCopies(p=>({...p,[k]:e.target.checked}))} style={{width:18,height:18,accentColor:"#1a1a2e"}}/>
                <span style={{fontWeight:600,fontSize:14}}>{v}</span>
                {k==="avsender"&&<span style={{fontSize:11,color:"#777",marginLeft:"auto"}}>rød stripe</span>}
                {k==="transportor"&&<span style={{fontSize:11,color:"#777",marginLeft:"auto"}}>blå stripe</span>}
                {k==="mottaker"&&<span style={{fontSize:11,color:"#777",marginLeft:"auto"}}>grønn stripe</span>}
                {k==="ekstra"&&<span style={{fontSize:11,color:"#777",marginLeft:"auto"}}>grå stripe</span>}
              </label>
            ))}
          </div>
        </div>

        {/* Labels */}
        <div style={{background:"#fff",borderRadius:10,padding:"20px 24px",marginBottom:16,border:"1.5px solid #d4a017"}}>
          <div style={{fontSize:15,fontWeight:800,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:20}}>⚠</span> Faremerker / Kolli-etiketter
          </div>
          <div style={{display:"grid",gap:10}}>
            {Object.entries(labelNames).map(([k,v])=>{
              const disabled = (k==="lithiumLabel" && !hasLithium) || (k==="orientationArrows" && !hasLiquids);
              return (
                <label key={k} style={{display:"flex",alignItems:"center",gap:10,cursor:disabled?"default":"pointer",padding:"8px 12px",borderRadius:6,background:disabled?"#f5f5f0":labels[k]?"#fff9e6":"#fafaf8",border:`1.5px solid ${disabled?"#eee":labels[k]?"#d4a017":"#ddd"}`,opacity:disabled?0.5:1}}>
                  <input type="checkbox" checked={labels[k]&&!disabled} disabled={disabled} onChange={e=>setLabels(p=>({...p,[k]:e.target.checked}))} style={{width:18,height:18,accentColor:"#d4a017"}}/>
                  <span style={{fontWeight:600,fontSize:13}}>{v}</span>
                  {disabled&&<span style={{fontSize:10,color:"#999",marginLeft:"auto"}}>ikke aktuelt</span>}
                </label>
              );
            })}
          </div>
          {Object.values(labels).some(Boolean) && (
            <div style={{marginTop:14,display:"flex",alignItems:"center",gap:10}}>
              <label style={{fontSize:13,fontWeight:600}}>Antall etikettark:</label>
              <input type="number" min="1" max="20" value={labelCount} onChange={e=>setLabelCount(Math.max(1,parseInt(e.target.value)||1))}
                style={{width:60,padding:"6px 10px",borderRadius:6,border:"1.5px solid #ccc",fontSize:14,textAlign:"center"}}/>
            </div>
          )}
        </div>

        {/* Preview of what will be generated */}
        <div style={{background:"#fff",borderRadius:10,padding:"16px 20px",marginBottom:20,border:"1px solid #e4e4dc"}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>Oppsummering</div>
          <div style={{fontSize:12,color:"#555",lineHeight:1.8}}>
            {Object.entries(copies).filter(([,v])=>v).map(([k])=><div key={k}>📄 Fraktbrev – {copyNames[k]}</div>)}
            {labels.hazardDiamond&&<div>◆ ADR-faresedler: {uniqueClasses.map(c=>`Klasse ${c}`).join(", ")} × {labelCount} ark</div>}
            {labels.unLabel&&<div>▪ UN-etiketter: {uniqueUNs.join(", ")} × {labelCount} ark</div>}
            {labels.lithiumLabel&&hasLithium&&<div>🔋 Lithiumbatteri-etikett × {labelCount} ark</div>}
            {labels.orientationArrows&&hasLiquids&&<div>↑↑ Orienteringspiler × {labelCount} ark</div>}
            <div style={{marginTop:8,fontWeight:700,color:"#1a1a2e"}}>Totalt ca. {totalPages} side(r)</div>
          </div>
        </div>

        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <button onClick={onBack} style={{background:"#333",color:"#fff",border:"none",borderRadius:8,padding:"12px 28px",cursor:"pointer",fontWeight:600,fontSize:14}}>← Tilbake til skjema</button>
          <button onClick={()=>onPrint({copies,labels,labelCount})} style={{background:"linear-gradient(135deg,#e5a100,#c89200)",color:"#1a1a2e",border:"none",borderRadius:8,padding:"12px 36px",cursor:"pointer",fontWeight:900,fontSize:15,flex:1,maxWidth:300}}>⎙ Generer og skriv ut</button>
        </div>
      </div>
    </div>
  );
}

// ===================== HAZARD LABELS PAGE =====================
function HazardLabelsPage({ dgItems, labels, labelCount }) {
  const uniqueItems = [];
  const seen = new Set();
  dgItems.forEach(it => { const key = `${it.un}-${it.class}`; if (!seen.has(key)) { seen.add(key); uniqueItems.push(it); } });
  const hasLithium = dgItems.some(i => LITHIUM_UNS.includes(i.un));
  const hasLiquids = dgItems.some(i => ["3","5.1","5.2","6.1","8"].includes(i.class));
  const pages = [];
  for (let p = 0; p < labelCount; p++) { pages.push(p); }

  return (<>{pages.map(pageIdx => (
    <div key={`labels-${pageIdx}`} style={{width:780,margin:"0 auto",background:"#fff",border:"1.2px solid #222",padding:"30px 40px",pageBreakBefore:pageIdx>0?"always":"auto",pageBreakAfter:"always"}}>
      <div style={{fontSize:16,fontWeight:900,marginBottom:4,letterSpacing:1}}>FAREMERKER / KOLLI-ETIKETTER</div>
      <div style={{fontSize:9,color:"#777",marginBottom:20}}>Ark {pageIdx+1} av {labelCount} · Klipp ut og fest på kolli iht. ADR 5.2</div>

      {/* ADR Hazard Diamonds */}
      {labels.hazardDiamond && (
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,marginBottom:10,color:"#555",textTransform:"uppercase",letterSpacing:1}}>ADR Faresedler (min. 100×100mm)</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:20}}>
            {uniqueItems.map((it,i) => (
              <div key={i} style={{textAlign:"center"}}>
                <HazardDiamondSVG classNum={it.class} size={120} />
                <div style={{fontSize:9,fontWeight:700,marginTop:4}}>Klasse {it.class}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UN Number Labels */}
      {labels.unLabel && (
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,marginBottom:10,color:"#555",textTransform:"uppercase",letterSpacing:1}}>UN-nummer-etiketter (min. 120×110mm)</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:16}}>
            {uniqueItems.map((it,i) => (
              <div key={i} style={{border:"3px solid #000",borderRadius:4,padding:"12px 20px",minWidth:140,textAlign:"center",background:"#fff"}}>
                <div style={{fontSize:24,fontWeight:900,fontFamily:"'Courier New',monospace",letterSpacing:2}}>{it.un}</div>
                <div style={{fontSize:8,marginTop:4,color:"#555",lineHeight:1.3}}>{it.nameEn}</div>
                <div style={{fontSize:8,color:"#777"}}>{it.nameNo}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lithium Battery Label */}
      {labels.lithiumLabel && hasLithium && (
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,marginBottom:10,color:"#555",textTransform:"uppercase",letterSpacing:1}}>Lithiumbatteri-etikett (min. 120×110mm)</div>
          {uniqueItems.filter(it=>LITHIUM_UNS.includes(it.un)).map((it,i)=>(
            <div key={i} style={{border:"3px solid #000",borderRadius:4,padding:16,maxWidth:320,marginBottom:12,background:"#fff"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <rect x="2" y="2" width="56" height="56" rx="4" fill="#fff" stroke="#c0392b" strokeWidth="3"/>
                  <rect x="18" y="10" width="24" height="36" rx="3" fill="none" stroke="#c0392b" strokeWidth="2.5"/>
                  <rect x="24" y="6" width="12" height="6" rx="1" fill="#c0392b"/>
                  <line x1="30" y1="18" x2="30" y2="32" stroke="#c0392b" strokeWidth="3"/>
                  <line x1="23" y1="25" x2="37" y2="25" stroke="#c0392b" strokeWidth="3"/>
                  <line x1="14" y1="50" x2="46" y2="50" stroke="#c0392b" strokeWidth="2"/>
                  <line x1="10" y1="46" x2="50" y2="46" stroke="#c0392b" strokeWidth="1.5"/>
                </svg>
                <div>
                  <div style={{fontSize:11,fontWeight:900,color:"#c0392b"}}>LITHIUM BATTERY</div>
                  <div style={{fontSize:9,fontWeight:700,marginTop:2}}>{it.un}</div>
                  <div style={{fontSize:8,marginTop:2,lineHeight:1.4}}>{it.nameEn}</div>
                  <div style={{fontSize:8,color:"#555",marginTop:4}}>For emergency information call: ___________</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orientation Arrows */}
      {labels.orientationArrows && hasLiquids && (
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:700,marginBottom:10,color:"#555",textTransform:"uppercase",letterSpacing:1}}>Orienteringspiler (to stk. – motstående sider)</div>
          <div style={{display:"flex",gap:24}}>
            {[0,1].map(idx=>(
              <div key={idx} style={{border:"2px solid #000",borderRadius:4,padding:"10px 24px",textAlign:"center",background:"#fff"}}>
                <div style={{display:"flex",gap:16,justifyContent:"center"}}>
                  <svg width="40" height="70" viewBox="0 0 40 70"><polygon points="20,0 40,25 28,25 28,70 12,70 12,25 0,25" fill="#c0392b"/></svg>
                  <svg width="40" height="70" viewBox="0 0 40 70"><polygon points="20,0 40,25 28,25 28,70 12,70 12,25 0,25" fill="#c0392b"/></svg>
                </div>
                <div style={{fontSize:8,marginTop:6,fontWeight:700}}>THIS WAY UP / DENNE SIDE OPP</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  ))}</>);
}

// ===================== SINGLE WAYBILL PAGE =====================
function WaybillPage({ data, copyLabel, copyColor, pageNum, totalPages }) {
  const { sender, receiver, shipment, goods, dgItems, altDelivery, useAltDelivery } = data;
  const del = useAltDelivery && altDelivery.name ? altDelivery : null;
  const totalBrutto = goods.reduce((s,g)=>s+(parseFloat(g.brutto)||0),0);
  const totalKolli = goods.reduce((s,g)=>s+(parseInt(g.antall)||0),0);
  const pCalcVol=(g)=>{const l=parseFloat(g.dimL)||0,b=parseFloat(g.dimB)||0,h=parseFloat(g.dimH)||0;return l&&b&&h?(l*b*h)/1000:0;};
  const totalVol = goods.reduce((s,g)=>s+pCalcVol(g),0);
  const pFmtDims=(g)=>[g.dimL,g.dimB,g.dimH].filter(Boolean).join("x");
  const hasCat0 = dgItems.some(i=>i.cat===0);
  const totalDGPoints = hasCat0?Infinity:dgItems.reduce((s,i)=>s+i.points,0);
  const isExempt = !hasCat0 && totalDGPoints<1000;

  const cs=(o={})=>({border:"0.8px solid #444",padding:"2px 5px",fontSize:9,verticalAlign:"top",...(o.bold&&{fontWeight:700}),...(o.bg&&{background:o.bg})});
  const lbl=(n,t)=><span style={{fontSize:7,color:"#666"}}>{n} {t}</span>;
  const val=(v,o={})=><div style={{fontSize:o.size||10,fontWeight:o.bold?800:400,marginTop:1,fontFamily:o.mono?"monospace":"inherit",minHeight:13}}>{v||"\u00A0"}</div>;

  return (
    <div style={{width:780,margin:"0 auto",background:"#fff",border:"1.2px solid #222",pageBreakAfter:"always",position:"relative"}}>
      {/* Copy color stripe */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:6,background:copyColor}}/>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",padding:"18px 18px 6px"}}>
        <div>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:1.5}}>FRAKTBREV ({pageNum}/{totalPages})</div>
          <div style={{fontSize:10,fontWeight:700,color:copyColor,marginTop:2,textTransform:"uppercase",letterSpacing:1}}>{copyLabel}</div>
        </div>
        <div style={{textAlign:"right"}}><div style={{fontFamily:"monospace",fontSize:10,letterSpacing:2}}>|||||||||||||||||||||||||||</div><div style={{fontSize:8,color:"#666",marginTop:2}}>(401) {genId()}</div></div>
      </div>

      {/* MAIN TABLE */}
      <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}><tbody>
        <tr><td colSpan="4" style={cs({bg:"#f4f4f0"})}>{lbl("1","Avsenders navn / kode")}{val(sender.name,{bold:true})}<div style={{fontSize:8,color:"#666"}}>{sender.orgnr?`Org.nr: ${sender.orgnr}`:""}</div></td><td colSpan="2" style={cs({bg:"#f4f4f0"})}>{lbl("15","Kundenr. hos transportør")}{val(shipment.kundenr,{mono:true,bold:true})}</td><td colSpan="2" style={cs({bg:"#f4f4f0"})}>{lbl("17","Utstedelsesdato")}{val(shipment.dato||today(),{bold:true})}</td></tr>
        <tr><td colSpan="4" style={cs()}>{lbl("2","Adresse")}{val(sender.address)}</td><td colSpan="2" style={cs()}>{lbl("16","Avsenders referanse")}{val(shipment.avsenderRef)}</td><td colSpan="2" style={cs()}>{lbl("18","Bookingreferanse")}{val(shipment.bookingRef)}</td></tr>
        <tr><td colSpan="2" style={cs()}>{lbl("3","Postnr.")}{val(sender.zip,{bold:true})}</td><td colSpan="2" style={cs()}>{lbl("","Sted")}{val(sender.city,{bold:true})}</td><td colSpan="4" style={cs()}>{lbl("","Tlf / E-post avsender")}<div style={{fontSize:9,marginTop:1}}>{[sender.phone,sender.email].filter(Boolean).join(" · ")||"\u00A0"}</div></td></tr>
        <tr><td colSpan="4" style={cs({bg:"#f4f4f0"})}>{lbl("4","Mottakers navn / kode")}{val(receiver.name,{bold:true})}<div style={{fontSize:8,color:"#666"}}>{receiver.orgnr?`Org.nr: ${receiver.orgnr}`:""}</div></td><td colSpan="2" style={cs()}>{lbl("19","Annen fraktbetalers navn")}{val("")}</td><td colSpan="2" style={cs()}>{lbl("20","Kundenr.")}{val("")}</td></tr>
        <tr><td colSpan="4" style={cs()}>{lbl("5","Adresse")}{val(receiver.address)}</td><td colSpan="4" style={cs()}>{lbl("21","Adresse")}{val("")}</td></tr>
        <tr><td colSpan="2" style={cs()}>{lbl("6","Postnr.")}{val(receiver.zip,{bold:true})}</td><td colSpan="2" style={cs()}>{lbl("","Sted")}{val(receiver.city,{bold:true})}</td><td colSpan="4" style={cs()}>{lbl("","Tlf / E-post mottaker")}<div style={{fontSize:9,marginTop:1}}>{[receiver.phone,receiver.email].filter(Boolean).join(" · ")||"\u00A0"}</div></td></tr>
        <tr><td colSpan="4" style={cs({bg:"#f4f4f0"})}>{lbl("7","Leveres til")}{val(del?del.name:(shipment.leveresNavn||receiver.name))}</td><td colSpan="2" style={cs()}>{lbl("23","Mott. kundenr.")}{val("")}</td><td colSpan="2" style={cs()}>{lbl("25","Mottakers ref.")}{val(shipment.mottakerRef)}</td></tr>
        <tr><td colSpan="4" style={cs()}>{lbl("8","Leveringsadresse")}{val(del?del.address:(shipment.leveringsadresse||receiver.address))}</td><td colSpan="2" style={cs()}>{lbl("24","Vareforsikring")}{val("")}</td><td style={cs()}>{lbl("","Kategori")}{val("")}</td><td style={cs()}>{lbl("26","Polisenr.")}{val("")}</td></tr>
        <tr><td colSpan="2" style={cs()}>{lbl("9","Stedsnr.")}{val(del?del.zip:receiver.zip)}</td><td colSpan="2" style={cs()}>{lbl("","Leveringssted")}{val(del?del.city:receiver.city)}</td><td colSpan="4" style={cs()}>{lbl("27","Leveringsbetingelser")}{val(shipment.leveringsbetingelser)}</td></tr>
        <tr><td colSpan="4" style={cs({bg:"#f4f4f0"})}>{lbl("10","Transportør")}{val(shipment.transportor,{bold:true})}</td><td colSpan="4" style={cs()}>{lbl("28","Frakt og omkostninger")}<div style={{fontSize:9,display:"flex",gap:12,marginTop:2}}><label><input type="checkbox" checked={shipment.fraktBelastes==="avsender"} readOnly style={{marginRight:3}}/>Avsender</label><label><input type="checkbox" checked={shipment.fraktBelastes==="mottaker"} readOnly style={{marginRight:3}}/>Mottaker</label><label><input type="checkbox" checked={shipment.fraktBelastes==="annen"} readOnly style={{marginRight:3}}/>Annen</label></div></td></tr>
        <tr><td style={cs()}>{lbl("11","Over")}</td><td style={cs()}>{lbl("12","Utveks. paller")}</td><td colSpan="2" style={cs()}>{lbl("13","Andre paller")}</td><td colSpan="4" style={cs()}>{lbl("29","Transportkoder")}<div style={{display:"flex",gap:6,marginTop:3,fontSize:10,fontWeight:700}}>{TRANSPORT_CODES.map(c=><span key={c} style={{width:16,textAlign:"center"}}>{c}</span>)}</div></td></tr>
        <tr><td colSpan="4" style={cs({bg:"#f4f4f0"})}>{lbl("14","Transportprodukt")}{val(shipment.transportprodukt,{bold:true})}</td><td colSpan="4" style={cs()}>{lbl("30","Leveringsinstruks")}{val(shipment.leveringsinstruks)}</td></tr>
        <tr><td colSpan="4" style={cs()}>{lbl("31","Avsenders kontonr.")}{val(sender.bankKonto)}</td><td colSpan="4" style={cs()}>{lbl("32","Girobeløp")}{val("")}</td></tr>
      </tbody></table>

      {/* GOODS */}
      <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed",marginTop:-1}}>
        <thead><tr style={{background:"#f4f4f0"}}>
          <th style={{...cs({bold:true}),width:"12%",textAlign:"left"}}>{lbl("33","Merking")}</th>
          <th style={{...cs({bold:true}),width:"8%",textAlign:"left"}}>{lbl("34","Ant.")}</th>
          <th style={{...cs({bold:true}),width:"22%",textAlign:"left"}}>{lbl("35","Type")}</th>
          <th style={{...cs({bold:true}),width:"12%",textAlign:"right"}}>{lbl("36","Brutto")}</th>
          <th style={{...cs({bold:true}),width:"14%",textAlign:"left"}}>{lbl("37","LxBxH")}</th>
          <th style={{...cs({bold:true}),width:"10%",textAlign:"right"}}>dm3</th>
          <th style={{...cs({bold:true}),width:"10%",textAlign:"right"}}>lm</th>
        </tr></thead>
        <tbody>
          {goods.map((g,i)=>{ const v=pCalcVol(g); return (<tr key={i}><td style={cs()}>{g.merking}</td><td style={cs()}>{g.antall}</td><td style={cs()}>{g.type}</td><td style={{...cs(),textAlign:"right"}}>{parseFloat(g.brutto||0).toFixed(1)}</td><td style={cs()}>{pFmtDims(g)}</td><td style={{...cs(),textAlign:"right"}}>{v>0?v.toFixed(1):"-"}</td><td style={{...cs(),textAlign:"right"}}>-</td></tr>); })}
          <tr style={{fontWeight:700,borderTop:"2px solid #222"}}><td style={cs({bold:true})}></td><td style={cs({bold:true})}>{totalKolli} TOT.</td><td style={cs({bold:true})}>{goods.length} linje(r)</td><td style={{...cs({bold:true}),textAlign:"right"}}>{totalBrutto.toFixed(1)} TOT.</td><td style={cs({bold:true})}>TOTALT</td><td style={{...cs({bold:true}),textAlign:"right"}}>{totalVol.toFixed(1)}</td><td style={{...cs({bold:true}),textAlign:"right"}}>0,0</td></tr>
        </tbody>
      </table>

      {/* DG */}
      {dgItems.length>0 && (
        <div style={{border:"1.2px solid #222",borderTop:"none"}}>
          <div style={{background:"#fff3cd",borderBottom:"2px solid #d4a017",padding:"6px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontWeight:800,fontSize:11}}>38 FARLIG GODS — ADR 5.4.1</span>
            <span style={{marginLeft:"auto",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:4,background:isExempt?"#d5f5e3":"#f5c6cb",color:isExempt?"#1e8449":"#c0392b",border:`1px solid ${isExempt?"#1e8449":"#c0392b"}`}}>
              {hasCat0?"KAT. 0 – FULL ADR":isExempt?"FRITATT (ADR 1.1.3.6)":"FULL ADR PÅKREVD"}
            </span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:8.5}}>
            <thead><tr style={{background:"#1a1a2e",color:"#fff"}}>
              {["UN","Proper Shipping Name","Kl.","EG","Tunnel","Kat.","Fakt.","Ant.","Netto","Poeng","Emb.","SP"].map(h=><th key={h} style={{padding:"3px 5px",textAlign:"left",fontSize:7.5,fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>{dgItems.map((it,i)=>(
              <tr key={i} style={{borderBottom:"0.5px solid #ccc",background:i%2===0?"#fff":"#fafaf5"}}>
                <td style={{padding:"3px 5px",fontFamily:"monospace",fontWeight:800,color:CLASS_COLORS[it.class]||"#c0392b"}}>{it.un}</td>
                <td style={{padding:"3px 5px"}}><div style={{fontWeight:600,fontSize:8.5}}>{it.nameEn}</div><div style={{fontSize:7.5,color:"#666"}}>{it.nameNo}{it.desc?` – ${it.desc}`:""}</div></td>
                <td style={{padding:"3px 5px",fontWeight:700}}>{it.class}</td>
                <td style={{padding:"3px 5px"}}>{it.pg||"—"}</td>
                <td style={{padding:"3px 5px"}}>{it.tunnel}</td>
                <td style={{padding:"3px 5px",fontWeight:700}}>{it.cat}</td>
                <td style={{padding:"3px 5px"}}>×{it.cat===0?"∞":CAT_MULTIPLIERS[it.cat]}</td>
                <td style={{padding:"3px 5px"}}>{it.qty}</td>
                <td style={{padding:"3px 5px",fontWeight:600}}>{it.totalQty.toFixed(2)} {it.unit}</td>
                <td style={{padding:"3px 5px",fontWeight:800,color:it.cat===0?"#c0392b":it.points>=333?"#e67e22":"#1e8449"}}>{it.cat===0?"∞":it.points.toFixed(1)}</td>
                <td style={{padding:"3px 5px",fontSize:7.5}}>{it.pi}</td>
                <td style={{padding:"3px 5px",fontSize:7.5}}>{it.sp}</td>
              </tr>
            ))}</tbody>
            <tfoot><tr style={{borderTop:"2px solid #222",fontWeight:800,background:"#f4f4f0"}}>
              <td colSpan="8" style={{padding:"4px 6px"}}>TOTALPOENG (ADR 1.1.3.6.4)</td>
              <td style={{padding:"4px 6px"}}>{dgItems.reduce((s,i)=>s+i.totalQty,0).toFixed(2)}</td>
              <td style={{padding:"4px 6px",fontSize:12,color:isExempt?"#1e8449":"#c0392b"}}>{hasCat0?"∞":totalDGPoints.toFixed(1)}</td>
              <td colSpan="2"></td>
            </tr></tfoot>
          </table>
          <div style={{padding:"5px 12px",borderTop:"1px solid #ccc",fontSize:7.5,color:"#444"}}>
            <strong>Merknad:</strong> {hasCat0?"Transportkategori 0 – full ADR.":isExempt?`${totalDGPoints.toFixed(1)} poeng – fritatt iht. 1.1.3.6.`:`${totalDGPoints.toFixed(1)} poeng – full ADR påkrevd.`}
          </div>
        </div>
      )}

      {/* Messages + cost */}
      <div style={{display:"flex",borderTop:dgItems.length===0?"1.2px solid #222":"none"}}>
        <div style={{flex:1,borderRight:"1.2px solid #222",padding:"8px 12px",minHeight:80}}>
          <div style={{fontSize:8,color:"#666",marginTop:4}}>Melding til mottaker</div><div style={{fontSize:9,minHeight:12}}>{shipment.meldingMottaker}</div>
          <div style={{fontSize:8,color:"#666",marginTop:6}}>Melding til transportøren</div><div style={{fontSize:9,minHeight:12}}>{shipment.meldingTransportor}</div>
        </div>
        <div style={{width:200,fontSize:9}}>
          <div style={{...cs({bg:"#f4f4f0"}),padding:"4px 8px"}}>{lbl("39","Fraktberegningsvekt (Kg)")}</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}><tbody>
            {[["40 Tekst","41 Beløp"],["Frakt",""],["Utkjøring",""],["SUM",""],["MVA",""],["TOTAL",""]].map(([l,r],i)=><tr key={i}><td style={{...cs(i===0||i===5?{bold:true,bg:"#f4f4f0"}:{}),width:"50%"}}>{l}</td><td style={{...cs(i===0||i===5?{bold:true,bg:"#f4f4f0"}:{}),textAlign:"right"}}>{r}</td></tr>)}
          </tbody></table>
        </div>
      </div>

      {/* Signatures */}
      <table style={{width:"100%",borderCollapse:"collapse",borderTop:"2px solid #222"}}><thead><tr style={{background:"#1a1a2e",color:"#fff"}}>{["AVSENDERSTED","UTLEVERINGSSTED","GODSET MOTTATT"].map(h=><th key={h} style={{...cs({bold:true}),color:"#fff",textAlign:"center",fontSize:9,width:"33%"}}>{h}</th>)}</tr></thead><tbody><tr>{[1,2,3].map(i=><td key={i} style={{...cs(),height:40}}><div style={{fontSize:7,color:"#666"}}>42 {i<3?"Datostempel/signatur":"Dato"}</div></td>)}</tr></tbody></table>

      {dgItems.length>0 && <div style={{border:"1.2px solid #222",borderTop:"none",padding:"6px 14px"}}><div style={{fontSize:8,color:"#555",lineHeight:1.5,marginBottom:6}}><strong>Avsenders erklæring:</strong> Innholdet er fullstendig og korrekt beskrevet, klassifisert, pakket, merket og etikettert iht. ADR/RID.</div><div style={{display:"flex",gap:24}}>{[["Underskrift",undefined],["Dato",100],["Navn",120]].map(([l,w])=><div key={l} style={{flex:w?undefined:1,width:w}}><div style={{borderBottom:"1.5px solid #222",height:24}}></div><div style={{fontSize:7,color:"#666",marginTop:2}}>{l}</div></div>)}</div></div>}

      <div style={{display:"flex",justifyContent:"space-between",padding:"4px 14px",borderTop:"1px solid #ccc"}}><div style={{fontWeight:900,fontSize:12,letterSpacing:2,color:"#1a1a2e"}}>FRAKTBREV</div><div style={{fontSize:8,color:"#999"}}>Generert {today()} · {copyLabel}</div></div>
    </div>
  );
}

// ===================== PRINT WRAPPER =====================
function PrintWrapper({ data, config, onBack }) {
  const copyDefs = [
    { key: "avsender", label: "AVSENDERS EKSEMPLAR", color: "#c0392b" },
    { key: "transportor", label: "TRANSPORTØRENS EKSEMPLAR", color: "#2980b9" },
    { key: "mottaker", label: "MOTTAKERS EKSEMPLAR", color: "#27ae60" },
    { key: "ekstra", label: "EKSTRA KOPI", color: "#7f8c8d" },
  ];
  const activeCopies = copyDefs.filter(c => config.copies[c.key]);
  const hasLabels = Object.entries(config.labels).some(([k,v])=>v);

  const doPrint = () => {
    try { window.print(); } catch(e) { alert("Utskrift er ikke tilgjengelig i denne visningen. Last ned prosjektet og kjør det lokalt eller på en webserver for å bruke utskriftsfunksjonen."); }
  };

  if (activeCopies.length === 0 && !hasLabels) {
    return (
      <div style={{fontFamily:"sans-serif",padding:40,textAlign:"center"}}>
        <p>Ingen kopier eller etiketter er valgt.</p>
        <button onClick={onBack} style={{marginTop:16,background:"#333",color:"#fff",border:"none",borderRadius:6,padding:"10px 24px",cursor:"pointer"}}>← Tilbake</button>
      </div>
    );
  }

  return (
    <div style={{fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",color:"#111",background:"#e8e8e4",minHeight:"100vh"}}>
      <div className="no-print" style={{padding:"12px 20px",display:"flex",gap:10,background:"#1a1a2e",flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"#333",color:"#fff",border:"none",borderRadius:6,padding:"8px 20px",cursor:"pointer",fontWeight:600,fontSize:13}}>← Tilbake</button>
        <button onClick={doPrint} style={{background:"linear-gradient(135deg,#e5a100,#c89200)",color:"#1a1a2e",border:"none",borderRadius:6,padding:"8px 24px",cursor:"pointer",fontWeight:800,fontSize:13}}>⎙ Skriv ut / PDF</button>
        <span style={{color:"#fff",fontSize:12,opacity:0.7,alignSelf:"center"}}>{activeCopies.length} fraktbrev{hasLabels?` + ${config.labelCount} etikettark`:""}</span>
      </div>

      <div style={{padding:"16px 0"}}>
        {activeCopies.map((c, idx) => (
          <div key={c.key} style={{marginBottom:20}}>
            <WaybillPage data={data} copyLabel={c.label} copyColor={c.color} pageNum={idx+1} totalPages={activeCopies.length} />
          </div>
        ))}
        {hasLabels && <HazardLabelsPage dgItems={data.dgItems} labels={config.labels} labelCount={config.labelCount} />}
      </div>

      <style>{`@media print{.no-print{display:none!important}body{margin:0;padding:0;background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4;margin:8mm}}`}</style>
    </div>
  );
}

// ===================== MAIN FORM =====================
export default function App() {
  const [view, setView] = useState("form");
  const [sender, setSender] = useState({name:"",orgnr:"",address:"",zip:"",city:"",phone:"",email:"",bankKonto:""});
  const [receiver, setReceiver] = useState({name:"",orgnr:"",address:"",zip:"",city:"",phone:"",email:""});
  const [shipment, setShipment] = useState({ kundenr:"",dato:today(),avsenderRef:"",bookingRef:"",mottakerRef:"",leveresNavn:"",leveringsadresse:"",leveringsbetingelser:"",transportor:"",transportprodukt:"",transportKoder:[],fraktBelastes:"avsender",leveringsinstruks:"",meldingMottaker:"",meldingTransportor:"" });
  const [useAltDelivery, setUseAltDelivery] = useState(false);
  const [altDelivery, setAltDelivery] = useState({name:"",address:"",zip:"",city:""});
  const [brregLoading, setBrregLoading] = useState({sender:false,receiver:false});
  const [brregError, setBrregError] = useState({sender:"",receiver:""});
  const [brregResults, setBrregResults] = useState({sender:null,receiver:null});

  // Brreg.no API: smart lookup - org.nr (9 digits) or name search
  const lookupBrreg = useCallback(async (query, target) => {
    const clean = (query||"").trim();
    if (!clean || clean.length < 2) {
      setBrregError(p=>({...p,[target]:"Skriv org.nr. (9 siffer) eller firmanavn (min 2 tegn)"}));
      return;
    }
    setBrregLoading(p=>({...p,[target]:true}));
    setBrregError(p=>({...p,[target]:""}));
    setBrregResults(p=>({...p,[target]:null}));

    const isOrgnr = /^\d{9}$/.test(clean.replace(/\s/g,""));

    try {
      if (isOrgnr) {
        // Direct lookup by org.nr.
        const orgnr = clean.replace(/\s/g,"");
        const res = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter/${orgnr}`);
        if (!res.ok) throw new Error(res.status===404?"Org.nr. ikke funnet":"Feil ved oppslag: "+res.status);
        const data = await res.json();
        applyBrregResult(data, target);
      } else {
        // Name search
        const res = await fetch(`https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(clean)}&size=8`);
        if (!res.ok) throw new Error("Feil ved navnesøk: "+res.status);
        const data = await res.json();
        const hits = data?._embedded?.enheter || [];
        if (hits.length === 0) {
          setBrregError(p=>({...p,[target]:`Ingen treff på "${clean}"`}));
        } else if (hits.length === 1) {
          applyBrregResult(hits[0], target);
        } else {
          setBrregResults(p=>({...p,[target]:hits}));
        }
      }
    } catch (err) {
      setBrregError(p=>({...p,[target]:err.message || "Kunne ikke koble til Brreg"}));
    } finally {
      setBrregLoading(p=>({...p,[target]:false}));
    }
  }, []);

  const applyBrregResult = useCallback((data, target) => {
    const addr = data.forretningsadresse || data.postadresse || {};
    const info = {
      name: data.navn || "",
      orgnr: data.organisasjonsnummer || "",
      address: (addr.adresse || []).join(", "),
      zip: addr.postnummer || "",
      city: (addr.poststed || "").replace(/^\w/, c => c.toUpperCase()),
    };
    if (target === "sender") setSender(p=>({...p,...info}));
    else setReceiver(p=>({...p,...info}));
    setBrregResults(p=>({...p,[target]:null}));
    setBrregError(p=>({...p,[target]:""}));
  }, []);
  const [goods, setGoods] = useState([{merking:"",antall:"1",type:"Pakke",brutto:"",dimL:"",dimB:"",dimH:""}]);
  const [dgItems, setDgItems] = useState([]);
  const [dgSearch, setDgSearch] = useState("");
  const [dgSelected, setDgSelected] = useState(null);
  const [dgQty, setDgQty] = useState(1);
  const [dgNetPer, setDgNetPer] = useState("");
  const [dgUnit, setDgUnit] = useState("kg");
  const [dgDesc, setDgDesc] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [dgWeightError, setDgWeightError] = useState("");

  const filteredDG = useMemo(() => {
    let list = DG_DATABASE;
    if (classFilter!=="all") list=list.filter(d=>d.class===classFilter);
    if (dgSearch.trim()) { const q=dgSearch.toLowerCase(); list=list.filter(d=>d.un.toLowerCase().includes(q)||d.name.toLowerCase().includes(q)||d.nameNo.toLowerCase().includes(q)); }
    return list.slice(0,30);
  }, [dgSearch,classFilter]);

  const addGoodsRow=()=>setGoods(p=>[...p,{merking:"",antall:"1",type:"Pakke",brutto:"",dimL:"",dimB:"",dimH:""}]);
  const removeGoodsRow=i=>setGoods(p=>p.filter((_,idx)=>idx!==i));
  const updateGoods=(i,k,v)=>setGoods(p=>p.map((g,idx)=>idx===i?{...g,[k]:v}:g));

  const totalBruttoGoods = useMemo(()=>goods.reduce((s,g)=>s+(parseFloat(g.brutto)||0),0),[goods]);
  const calcVol=(g)=>{const l=parseFloat(g.dimL)||0,b=parseFloat(g.dimB)||0,h=parseFloat(g.dimH)||0;return l&&b&&h?(l*b*h)/1000:0;};
  const totalVolGoods = useMemo(()=>goods.reduce((s,g)=>s+calcVol(g),0),[goods]);
  const fmtDims=(g)=>[g.dimL,g.dimB,g.dimH].filter(Boolean).join("x");
  const totalDgNetto = useMemo(()=>dgItems.reduce((s,i)=>s+i.totalQty,0),[dgItems]);

  const addDgItem=useCallback(()=>{
    if(!dgSelected)return;
    const qty=parseInt(dgQty)||1, net=parseFloat(dgNetPer)||0.5, totalQty=qty*net;
    // Check: sum netto DG weight cannot exceed total brutto in goods
    const currentDgNetto = dgItems.reduce((s,i)=>s+i.totalQty,0);
    if(dgUnit==="kg" && totalBruttoGoods > 0 && (currentDgNetto + totalQty) > totalBruttoGoods) {
      setDgWeightError(`Sum nettovekt farlig gods (${(currentDgNetto+totalQty).toFixed(2)} kg) overskrider total bruttovekt i kolli (${totalBruttoGoods.toFixed(1)} kg). Øk bruttovekten i steg 4 eller reduser nettovekten.`);
      return;
    }
    setDgWeightError("");
    const points=calcPoints(dgSelected.cat,totalQty);
    setDgItems(p=>[...p,{ un:dgSelected.un,nameEn:dgSelected.name,nameNo:dgSelected.nameNo,class:dgSelected.class,pg:dgSelected.pg,sp:dgSelected.sp,pi:dgSelected.pi,tunnel:dgSelected.tunnel,cat:dgSelected.cat,label:dgSelected.label,qty,netPer:net,totalQty,points,unit:dgUnit,desc:dgDesc }]);
    setDgSelected(null);setDgSearch("");setDgQty(1);setDgNetPer("");setDgDesc("");
  },[dgSelected,dgQty,dgNetPer,dgUnit,dgDesc,dgItems,totalBruttoGoods]);

  const hasCat0=dgItems.some(i=>i.cat===0);
  const totalDGPoints=hasCat0?Infinity:dgItems.reduce((s,i)=>s+i.points,0);
  const isExempt=!hasCat0&&totalDGPoints<1000;

  // === VALIDATION ===
  const [tried, setTried] = useState(false);

  const validation = useMemo(() => {
    const e = {};
    if (!sender.name.trim()) e.senderName = true;
    if (!sender.address.trim()) e.senderAddress = true;
    if (!sender.zip.trim()) e.senderZip = true;
    if (!sender.city.trim()) e.senderCity = true;
    if (!receiver.name.trim()) e.receiverName = true;
    if (!receiver.address.trim()) e.receiverAddress = true;
    if (!receiver.zip.trim()) e.receiverZip = true;
    if (!receiver.city.trim()) e.receiverCity = true;
    if (!shipment.dato.trim()) e.shipDato = true;
    if (!shipment.transportor.trim()) e.shipTransportor = true;
    const hasValidGoods = goods.some(g => (parseInt(g.antall) || 0) > 0 && (parseFloat(g.brutto) || 0) > 0);
    if (!hasValidGoods) e.goods = true;
    if (dgItems.length === 0) e.dgItems = true;
    const dgNettoSum = dgItems.reduce((s,i)=>s+i.totalQty,0);
    const bruttoSum = goods.reduce((s,g)=>s+(parseFloat(g.brutto)||0),0);
    if (dgItems.length > 0 && bruttoSum > 0 && dgNettoSum > bruttoSum) e.weightOverflow = true;
    e.sec1Ok = !e.senderName && !e.senderAddress && !e.senderZip && !e.senderCity;
    e.sec2Ok = !e.receiverName && !e.receiverAddress && !e.receiverZip && !e.receiverCity;
    e.sec3Ok = !e.shipDato && !e.shipTransportor;
    e.sec4Ok = !e.goods;
    e.sec5Ok = !e.dgItems && !e.weightOverflow;
    e.allOk = e.sec1Ok && e.sec2Ok && e.sec3Ok && e.sec4Ok && e.sec5Ok;
    return e;
  }, [sender, receiver, shipment, goods, dgItems]);

  const [printConfig, setPrintConfig] = useState(null);

  const handleGenerate = () => {
    setTried(true);
    if (validation.allOk) setView("config");
  };

  const handlePrint = useCallback((cfg) => {
    setPrintConfig(cfg);
    // Use timeout to ensure state is set before view switch
    setTimeout(() => setView("print"), 0);
  }, []);

  if(view==="config") return <PrintConfig data={{sender,receiver,shipment,goods,dgItems,altDelivery,useAltDelivery}} onBack={()=>setView("form")} onPrint={handlePrint}/>;
  if(view==="print") {
    if(!printConfig) return <div style={{padding:40,textAlign:"center",fontFamily:"sans-serif"}}>Laster utskrift...</div>;
    return <PrintWrapper data={{sender,receiver,shipment,goods,dgItems,altDelivery,useAltDelivery}} config={printConfig} onBack={()=>setView("config")}/>;
  }

  const errBorder = "1.5px solid #e74c3c";
  const errBg = "#fef2f2";
  const inp0={width:"100%",boxSizing:"border-box",padding:"9px 12px",borderRadius:6,border:"1.5px solid #c8c8c0",fontSize:13,fontFamily:"inherit",background:"#fafaf8",outline:"none"};
  const inpS=(hasErr)=>({...inp0,...(tried&&hasErr?{border:errBorder,background:errBg}:{})});
  const lb={fontSize:11,fontWeight:700,color:"#555",marginBottom:3,display:"block",letterSpacing:0.3};
  const lbR=(hasErr)=>({...lb,...(tried&&hasErr?{color:"#e74c3c"}:{})});

  // Brreg search query state (controlled by parent to avoid re-mount focus loss)
  const [brregQuery, setBrregQuery] = useState({sender:"",receiver:""});

  const renderBrregField = (target) => {
    const q = brregQuery[target];
    const loading = brregLoading[target];
    const error = brregError[target];
    const results = brregResults[target];
    const doSearch = () => { lookupBrreg(q, target); };
    const onKey = (e) => { if(e.key==="Enter"){e.preventDefault();doSearch();} };

    return (
      <div className="full-span">
        <label style={lb}>Søk i Brreg (org.nr. eller firmanavn)</label>
        <div style={{display:"flex",gap:6}}>
          <input style={{...inp0,flex:1}} value={q}
            onChange={e=>setBrregQuery(p=>({...p,[target]:e.target.value}))}
            onKeyDown={onKey}
            placeholder="F.eks. 123456789 eller Firma AS" />
          <button onClick={doSearch} disabled={loading}
            style={{background:"#1a1a2e",color:"#fff",border:"none",borderRadius:6,padding:"0 16px",cursor:"pointer",fontWeight:700,fontSize:12,whiteSpace:"nowrap",opacity:loading?0.5:1,minHeight:38}}>
            {loading?"Søker...":"Søk Brreg"}
          </button>
        </div>
        {error && <div style={{fontSize:11,color:"#e74c3c",marginTop:4}}>{error}</div>}
        {results && results.length > 1 && (
          <div style={{marginTop:6,border:"1px solid #d4a017",borderRadius:8,maxHeight:200,overflowY:"auto",background:"#fff"}}>
            <div style={{padding:"6px 12px",fontSize:10,fontWeight:700,color:"#999",background:"#fff9e6",borderBottom:"1px solid #eee"}}>{results.length} treff – velg riktig firma:</div>
            {results.map((r,i)=>{
              const a = r.forretningsadresse || r.postadresse || {};
              return (
                <div key={r.organisasjonsnummer} onClick={()=>{applyBrregResult(r,target);setBrregQuery(p=>({...p,[target]:r.organisasjonsnummer}));}}
                  style={{padding:"10px 12px",cursor:"pointer",borderBottom:"1px solid #f0f0ea",background:i%2===0?"#fff":"#fafaf8"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:13}}>{r.navn}</span>
                    <span style={{fontFamily:"monospace",fontSize:11,color:"#777"}}>{r.organisasjonsnummer}</span>
                  </div>
                  <div style={{fontSize:11,color:"#888",marginTop:2}}>
                    {(a.adresse||[]).join(", ")}{a.postnummer?`, ${a.postnummer}`:""}{a.poststed?` ${a.poststed}`:""}
                    {r.organisasjonsform?.beskrivelse && <span style={{marginLeft:8,color:"#aaa"}}>({r.organisasjonsform.beskrivelse})</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  const card={background:"#fff",borderRadius:10,padding:"20px 24px",marginBottom:16,boxShadow:"0 1px 5px rgba(0,0,0,0.05)",border:"1px solid #e4e4dc"};
  const cardE=(secOk)=>({...card,...(tried&&!secOk?{border:"1.5px solid #e74c3c",boxShadow:"0 0 0 3px rgba(231,76,60,0.1)"}:{})});
  const reqDot = <span style={{color:"#e74c3c",marginLeft:2}}>*</span>;
  const secT=(num,text,secOk)=>(<div style={{fontSize:14,fontWeight:800,marginBottom:14,display:"flex",alignItems:"center",gap:8,color:"#1a1a2e"}}><span style={{background:"#1a1a2e",color:"#fff",width:24,height:24,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800}}>{num}</span>{text}{tried && secOk !== undefined && (secOk ? <span style={{fontSize:11,color:"#1e8449",fontWeight:700,marginLeft:6}}>✓</span> : <span style={{fontSize:11,color:"#e74c3c",fontWeight:600,marginLeft:6}}>— obligatoriske felt mangler</span>)}</div>);
  const uniqueClasses=[...new Set(DG_DATABASE.map(d=>d.class))].sort((a,b)=>parseFloat(a)-parseFloat(b));

  return (
    <div style={{fontFamily:"'Segoe UI','Helvetica Neue',sans-serif",minHeight:"100vh",background:"#f0f0ea",color:"#1a1a2e"}}>
      <style>{`
        *{box-sizing:border-box}
        input[type="date"]{max-width:100%;-webkit-appearance:none;appearance:none}
        .rg2,.rg3,.rg-alt,.rg-dg-search{display:grid;grid-template-columns:1fr;gap:12px}
        .rg-zip{display:grid;grid-template-columns:2fr 3fr;gap:10px}
        .rg-half{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .rg-dg-add{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:end}
        .rg-dg-add>:nth-child(4){grid-column:1/-1}
        .rg-dg-add>button{grid-column:1/-1;height:44px!important}
        .full-span{grid-column:1/-1}
        .goods-table{width:100%;border-collapse:collapse;font-size:12px}
        .goods-table th,.goods-table td{padding:3px 4px}
        .goods-table th{padding:8px 6px;text-align:left;font-weight:700;border-bottom:2px solid #1a1a2e;font-size:10px}
        .goods-table .col-desk{display:none}
        .goods-desk-only{display:none}
        .goods-mob-only{display:block}
        .dg-items-table{width:100%;border-collapse:collapse;font-size:11px}
        .dg-items-table th{padding:5px 6px;text-align:left;font-weight:700;border-bottom:2px solid #1a1a2e;font-size:10px}
        .dg-items-table td{padding:5px 6px}
        .dg-items-table .col-desk{display:none}
        .card-mob{padding:16px 16px}
        .header-mob{padding:16px 18px;gap:10px}
        .header-mob .h-title{font-size:17px}
        .header-mob .h-sub{font-size:10px}
        .form-pad{padding:14px 10px}
        .gen-btn{padding:14px 28px;font-size:15px;width:100%;max-width:400px}
        .pts-val{font-size:22px}
        .dg-search-item{padding:10px 12px;cursor:pointer;border-bottom:1px solid #eee;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .dg-search-item:active{background:#e8f0fe}
        .dg-sel-header{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;font-size:13px}
        @media(min-width:641px){
          .rg2{grid-template-columns:1fr 1fr}
          .rg3{grid-template-columns:1fr 1fr 1fr}
          .rg-alt{grid-template-columns:1fr 1fr}
          .rg-dg-search{grid-template-columns:2fr 1fr}
          .rg-zip{grid-template-columns:1fr 2fr}
          .rg-dg-add{grid-template-columns:1fr 1fr 1fr 2fr auto;gap:10px}
          .rg-dg-add>:nth-child(4){grid-column:auto}
          .rg-dg-add>button{grid-column:auto;height:38px!important}
          .goods-desk-only{display:block}
          .goods-mob-only{display:none}
          .goods-table{font-size:13px}
          .goods-table .col-desk{display:table-cell}
          .goods-table th,.goods-table td{padding:4px 6px}
          .dg-items-table{font-size:12px}
          .dg-items-table .col-desk{display:table-cell}
          .dg-items-table th{padding:7px 8px;font-size:11px}
          .dg-items-table td{padding:6px 8px}
          .card-mob{padding:20px 24px}
          .header-mob{padding:20px 28px;gap:14px}
          .header-mob .h-title{font-size:20px}
          .header-mob .h-sub{font-size:12px}
          .form-pad{padding:22px 16px}
          .gen-btn{padding:16px 48px;font-size:17px}
          .pts-val{font-size:26px}
          .dg-sel-header{font-size:15px}
        }
      `}</style>
      <div className="header-mob" style={{background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)",color:"#fff",padding:"20px 28px",display:"flex",alignItems:"center",gap:14}}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e5a100" strokeWidth="2"><rect x="6" y="4" width="12" height="18" rx="2"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/><path d="M12 10v5"/><path d="M9.5 12.5h5"/></svg>
        <div><div className="h-title" style={{fontSize:20,fontWeight:900,letterSpacing:1}}>Fraktbrev — Farlig Gods</div><div className="h-sub" style={{fontSize:12,opacity:0.6,marginTop:1}}>Alle ADR-klasser 1–9 · Poengberegning 1.1.3.6 · Fraktbrev</div></div>
      </div>
      <div style={{height:5,background:"repeating-linear-gradient(135deg,#e5a100 0px,#e5a100 8px,#1a1a2e 8px,#1a1a2e 16px)",opacity:0.8}}/>

      <div className="form-pad" style={{maxWidth:900,margin:"0 auto",padding:"22px 16px"}}>
        {/* SENDER */}
        <div className="card-mob" style={cardE(validation.sec1Ok)}>{secT("1","Avsender",validation.sec1Ok)}
          <div className="rg2">
            {renderBrregField("sender")}
            <div className="full-span"><label style={lbR(validation.senderName)}>Firmanavn{reqDot}</label><input style={inpS(validation.senderName)} value={sender.name} onChange={e=>setSender(p=>({...p,name:e.target.value}))}/></div>
            <div className="full-span"><label style={lbR(validation.senderAddress)}>Adresse{reqDot}</label><input style={inpS(validation.senderAddress)} value={sender.address} onChange={e=>setSender(p=>({...p,address:e.target.value}))}/></div>
            <div className="rg-zip"><div><label style={lbR(validation.senderZip)}>Postnr.{reqDot}</label><input style={inpS(validation.senderZip)} value={sender.zip} onChange={e=>setSender(p=>({...p,zip:e.target.value}))}/></div><div><label style={lbR(validation.senderCity)}>Sted{reqDot}</label><input style={inpS(validation.senderCity)} value={sender.city} onChange={e=>setSender(p=>({...p,city:e.target.value}))}/></div></div>
            <div className="rg-half"><div><label style={lb}>Telefon</label><input style={inp0} value={sender.phone} onChange={e=>setSender(p=>({...p,phone:e.target.value}))}/></div><div><label style={lb}>E-post</label><input style={inp0} value={sender.email} onChange={e=>setSender(p=>({...p,email:e.target.value}))}/></div></div>
          </div>
        </div>

        {/* RECEIVER */}
        <div className="card-mob" style={cardE(validation.sec2Ok)}>{secT("2","Mottaker",validation.sec2Ok)}
          <div className="rg2">
            {renderBrregField("receiver")}
            <div className="full-span"><label style={lbR(validation.receiverName)}>Firmanavn{reqDot}</label><input style={inpS(validation.receiverName)} value={receiver.name} onChange={e=>setReceiver(p=>({...p,name:e.target.value}))}/></div>
            <div className="full-span"><label style={lbR(validation.receiverAddress)}>Adresse{reqDot}</label><input style={inpS(validation.receiverAddress)} value={receiver.address} onChange={e=>setReceiver(p=>({...p,address:e.target.value}))}/></div>
            <div className="rg-zip"><div><label style={lbR(validation.receiverZip)}>Postnr.{reqDot}</label><input style={inpS(validation.receiverZip)} value={receiver.zip} onChange={e=>setReceiver(p=>({...p,zip:e.target.value}))}/></div><div><label style={lbR(validation.receiverCity)}>Sted{reqDot}</label><input style={inpS(validation.receiverCity)} value={receiver.city} onChange={e=>setReceiver(p=>({...p,city:e.target.value}))}/></div></div>
            <div className="rg-half"><div><label style={lb}>Telefon</label><input style={inp0} value={receiver.phone} onChange={e=>setReceiver(p=>({...p,phone:e.target.value}))}/></div><div><label style={lb}>E-post</label><input style={inp0} value={receiver.email} onChange={e=>setReceiver(p=>({...p,email:e.target.value}))}/></div></div>
          </div>
          <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid #e4e4dc"}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:600,color:"#1a1a2e"}}>
              <input type="checkbox" checked={useAltDelivery} onChange={e=>setUseAltDelivery(e.target.checked)} style={{width:16,height:16,accentColor:"#1a1a2e"}}/>
              Annen leveringsadresse
            </label>
            {useAltDelivery && (
              <div className="rg-alt" style={{marginTop:12,padding:"14px 16px",background:"#f8f8f4",borderRadius:8,border:"1px solid #e4e4dc"}}>
                <div><label style={lb}>Leveres til (navn)</label><input style={inp0} value={altDelivery.name} onChange={e=>setAltDelivery(p=>({...p,name:e.target.value}))} placeholder="Firmanavn / kontakt"/></div>
                <div><label style={lb}>Leveringsadresse</label><input style={inp0} value={altDelivery.address} onChange={e=>setAltDelivery(p=>({...p,address:e.target.value}))}/></div>
                <div className="rg-zip"><div><label style={lb}>Postnr.</label><input style={inp0} value={altDelivery.zip} onChange={e=>setAltDelivery(p=>({...p,zip:e.target.value}))}/></div><div><label style={lb}>Sted</label><input style={inp0} value={altDelivery.city} onChange={e=>setAltDelivery(p=>({...p,city:e.target.value}))}/></div></div>
              </div>
            )}
          </div>
        </div>

        {/* SHIPMENT */}
        <div className="card-mob" style={cardE(validation.sec3Ok)}>{secT("3","Fraktdetaljer",validation.sec3Ok)}
          <div className="rg2">
            <div><label style={lbR(validation.shipDato)}>Utstedelsesdato{reqDot}</label><input style={inpS(validation.shipDato)} type="date" value={shipment.dato} onChange={e=>setShipment(p=>({...p,dato:e.target.value}))}/></div>
            <div><label style={lbR(validation.shipTransportor)}>Transportør{reqDot}</label><input style={inpS(validation.shipTransportor)} value={shipment.transportor} onChange={e=>setShipment(p=>({...p,transportor:e.target.value}))} placeholder="F.eks. Schenker"/></div>
            <div><label style={lb}>Kundenr. hos transportør</label><input style={inp0} value={shipment.kundenr} onChange={e=>setShipment(p=>({...p,kundenr:e.target.value}))}/></div>
            <div><label style={lb}>Transportprodukt</label><input style={inp0} value={shipment.transportprodukt} onChange={e=>setShipment(p=>({...p,transportprodukt:e.target.value}))}/></div>
            <div><label style={lb}>Avsenders referanse</label><input style={inp0} value={shipment.avsenderRef} onChange={e=>setShipment(p=>({...p,avsenderRef:e.target.value}))}/></div>
            <div><label style={lb}>Bookingreferanse</label><input style={inp0} value={shipment.bookingRef} onChange={e=>setShipment(p=>({...p,bookingRef:e.target.value}))}/></div>
            <div><label style={lb}>Mottakers referanse</label><input style={inp0} value={shipment.mottakerRef} onChange={e=>setShipment(p=>({...p,mottakerRef:e.target.value}))}/></div>
            <div><label style={lb}>Frakt belastes</label><select style={{...inp0,cursor:"pointer"}} value={shipment.fraktBelastes} onChange={e=>setShipment(p=>({...p,fraktBelastes:e.target.value}))}><option value="avsender">Avsender</option><option value="mottaker">Mottaker</option><option value="annen">Annen</option></select></div>
            <div><label style={lb}>Leveringsinstruks</label><input style={inp0} value={shipment.leveringsinstruks} onChange={e=>setShipment(p=>({...p,leveringsinstruks:e.target.value}))}/></div>
            <div><label style={lb}>Leveringsbetingelser</label><input style={inp0} value={shipment.leveringsbetingelser} onChange={e=>setShipment(p=>({...p,leveringsbetingelser:e.target.value}))}/></div>
            <div className="full-span"><label style={lb}>Melding til mottaker</label><input style={inp0} value={shipment.meldingMottaker} onChange={e=>setShipment(p=>({...p,meldingMottaker:e.target.value}))}/></div>
            <div className="full-span"><label style={lb}>Melding til transportøren</label><input style={inp0} value={shipment.meldingTransportor} onChange={e=>setShipment(p=>({...p,meldingTransportor:e.target.value}))}/></div>
            <div><label style={lb}>Avsenders post/bank-kontonr.</label><input style={inp0} value={sender.bankKonto} onChange={e=>setSender(p=>({...p,bankKonto:e.target.value}))}/></div>
          </div>
        </div>

        {/* GOODS */}
        <div className="card-mob" style={cardE(validation.sec4Ok)}>{secT("4","Kolli / Godsbeskrivelse",validation.sec4Ok)}
          {tried && validation.goods && <div style={{marginBottom:12,padding:"8px 14px",borderRadius:6,background:"#fef2f2",border:"1px solid #e74c3c",fontSize:12,color:"#c0392b",fontWeight:600}}>Minst én varelinje må ha antall og bruttovekt fylt ut.</div>}

          {/* Desktop table - hidden on mobile */}
          <div className="goods-desk-only" style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table className="goods-table" style={{minWidth:580}}><thead><tr style={{background:"#f4f4f0"}}>
              <th>Merking</th><th>Ant. *</th><th>Type</th><th>Brutto *</th><th>L</th><th>B</th><th>H</th><th>dm³</th><th></th>
            </tr></thead>
            <tbody>{goods.map((g,i)=>{
              const rma = tried && validation.goods && !(parseInt(g.antall)>0);
              const rmb = tried && validation.goods && !(parseFloat(g.brutto)>0);
              const vol = calcVol(g);
              return <tr key={i}>
              <td><input style={{...inp0,padding:"7px 8px"}} value={g.merking} onChange={e=>updateGoods(i,"merking",e.target.value)}/></td>
              <td style={{width:60}}><input style={{...inp0,padding:"7px 6px",...(rma?{border:errBorder,background:errBg}:{})}} type="number" min="1" value={g.antall} onChange={e=>updateGoods(i,"antall",e.target.value)}/></td>
              <td style={{width:90}}><select style={{...inp0,padding:"7px 4px",cursor:"pointer",fontSize:12}} value={g.type} onChange={e=>updateGoods(i,"type",e.target.value)}>{["Pakke","Pall","Kartong","Kolli","Fat","Kanne","Annet"].map(t=><option key={t}>{t}</option>)}</select></td>
              <td style={{width:80}}><input style={{...inp0,padding:"7px 6px",...(rmb?{border:errBorder,background:errBg}:{})}} type="number" step="0.1" value={g.brutto} onChange={e=>updateGoods(i,"brutto",e.target.value)} placeholder="kg"/></td>
              <td style={{width:58}}><input style={{...inp0,padding:"7px 4px",fontSize:12}} type="number" min="0" value={g.dimL} onChange={e=>updateGoods(i,"dimL",e.target.value)} placeholder="L"/></td>
              <td style={{width:58}}><input style={{...inp0,padding:"7px 4px",fontSize:12}} type="number" min="0" value={g.dimB} onChange={e=>updateGoods(i,"dimB",e.target.value)} placeholder="B"/></td>
              <td style={{width:58}}><input style={{...inp0,padding:"7px 4px",fontSize:12}} type="number" min="0" value={g.dimH} onChange={e=>updateGoods(i,"dimH",e.target.value)} placeholder="H"/></td>
              <td style={{width:54,textAlign:"right",fontSize:12,fontWeight:vol>0?600:400,color:vol>0?"#1a1a2e":"#bbb"}}>{vol>0?vol.toFixed(1):"-"}</td>
              <td style={{width:30}}>{goods.length>1&&<button onClick={()=>removeGoodsRow(i)} style={{background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:16,fontWeight:700}}>✕</button>}</td>
            </tr>})}</tbody>
            <tfoot><tr style={{background:"#f4f4f0",fontWeight:700,borderTop:"2px solid #1a1a2e"}}>
              <td style={{padding:"8px 6px",fontSize:11}}>TOTALT</td>
              <td style={{padding:"8px 4px",fontSize:11}}>{goods.reduce((s,g)=>s+(parseInt(g.antall)||0),0)}</td>
              <td style={{padding:"8px 4px",fontSize:10}}>{goods.length} linje(r)</td>
              <td style={{padding:"8px 4px",fontSize:11}}>{totalBruttoGoods.toFixed(1)} kg</td>
              <td colSpan="3" style={{padding:"8px 4px",fontSize:10,color:"#777",textAlign:"right"}}>Σ vol:</td>
              <td style={{padding:"8px 4px",fontSize:12,fontWeight:800,textAlign:"right"}}>{totalVolGoods.toFixed(1)}</td>
              <td></td>
            </tr></tfoot>
            </table>
          </div>

          {/* Mobile cards - hidden on desktop */}
          <div className="goods-mob-only">
            {goods.map((g,i)=>{
              const rma = tried && validation.goods && !(parseInt(g.antall)>0);
              const rmb = tried && validation.goods && !(parseFloat(g.brutto)>0);
              const vol = calcVol(g);
              return (
                <div key={i} style={{background:"#fafaf8",border:"1px solid #e4e4dc",borderRadius:8,padding:14,marginBottom:10,position:"relative"}}>
                  {goods.length>1&&<button onClick={()=>removeGoodsRow(i)} style={{position:"absolute",top:8,right:10,background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:18,fontWeight:700}}>✕</button>}
                  <div style={{fontSize:11,fontWeight:700,color:"#999",marginBottom:8}}>Varelinje {i+1}</div>
                  <div style={{marginBottom:8}}><label style={lb}>Merking</label><input style={{...inp0}} value={g.merking} onChange={e=>updateGoods(i,"merking",e.target.value)}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    <div><label style={lb}>Antall *</label><input style={{...inp0,...(rma?{border:errBorder,background:errBg}:{})}} type="number" min="1" value={g.antall} onChange={e=>updateGoods(i,"antall",e.target.value)}/></div>
                    <div><label style={lb}>Type</label><select style={{...inp0,cursor:"pointer"}} value={g.type} onChange={e=>updateGoods(i,"type",e.target.value)}>{["Pakke","Pall","Kartong","Kolli","Fat","Kanne","Annet"].map(t=><option key={t}>{t}</option>)}</select></div>
                  </div>
                  <div style={{marginBottom:8}}><label style={lb}>Bruttovekt (kg) *</label><input style={{...inp0,...(rmb?{border:errBorder,background:errBg}:{})}} type="number" step="0.1" value={g.brutto} onChange={e=>updateGoods(i,"brutto",e.target.value)} placeholder="kg"/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:6}}>
                    <div><label style={lb}>L (cm)</label><input style={inp0} type="number" min="0" value={g.dimL} onChange={e=>updateGoods(i,"dimL",e.target.value)}/></div>
                    <div><label style={lb}>B (cm)</label><input style={inp0} type="number" min="0" value={g.dimB} onChange={e=>updateGoods(i,"dimB",e.target.value)}/></div>
                    <div><label style={lb}>H (cm)</label><input style={inp0} type="number" min="0" value={g.dimH} onChange={e=>updateGoods(i,"dimH",e.target.value)}/></div>
                  </div>
                  <div style={{textAlign:"right",fontSize:13,fontWeight:700,color:vol>0?"#1a1a2e":"#bbb"}}>= {vol>0?vol.toFixed(1):"-"} dm³</div>
                </div>
              );
            })}
            {/* Mobile totals */}
            <div style={{background:"#f4f4f0",borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:700}}>
              <span>{goods.reduce((s,g)=>s+(parseInt(g.antall)||0),0)} kolli · {totalBruttoGoods.toFixed(1)} kg</span>
              <span>Σ {totalVolGoods.toFixed(1)} dm³</span>
            </div>
          </div>

          <button onClick={addGoodsRow} style={{marginTop:10,background:"#1a1a2e",color:"#fff",border:"none",borderRadius:6,padding:"10px 18px",cursor:"pointer",fontWeight:600,fontSize:13,width:"100%",maxWidth:220}}>+ Legg til varelinje</button>
        </div>

        {/* DANGEROUS GOODS */}
        <div className="card-mob" style={{...cardE(validation.sec5Ok),border:tried&&!validation.sec5Ok?"1.5px solid #e74c3c":"1.5px solid #d4a017"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <div className="dg-diamond" style={{width:30,height:30,transform:"rotate(45deg)",border:"2.5px solid #1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",background:"#fff",flexShrink:0}}><span style={{transform:"rotate(-45deg)",fontWeight:900,fontSize:14}}>⚠</span></div>
            <div style={{fontSize:14,fontWeight:800}}>Farlig gods</div>
            {tried && !validation.sec5Ok ? <span className="sec-err" style={{fontSize:11,color:"#e74c3c",fontWeight:600}}>— legg til minst 1</span> : tried && validation.sec5Ok ? <span style={{fontSize:11,color:"#1e8449",fontWeight:700}}>✓</span> : null}
            <div style={{marginLeft:"auto",fontSize:11,color:"#777"}}>{DG_DATABASE.length} stoffer</div>
          </div>
          {tried && validation.dgItems && <div style={{marginBottom:12,padding:"8px 14px",borderRadius:6,background:"#fef2f2",border:"1px solid #e74c3c",fontSize:12,color:"#c0392b",fontWeight:600}}>Du må legge til minst 1 farlig gods-klassifisering med antall og nettovekt.</div>}

          <div className="rg-dg-search" style={{marginBottom:12}}>
            <div><label style={lb}>Søk UN-nr eller stoffnavn</label><input style={inp0} value={dgSearch} onChange={e=>{setDgSearch(e.target.value);setDgSelected(null);}} placeholder="F.eks. UN3480, diesel..."/></div>
            <div><label style={lb}>Filtrer på klasse</label><select style={{...inp0,cursor:"pointer"}} value={classFilter} onChange={e=>setClassFilter(e.target.value)}><option value="all">Alle klasser (1–9)</option>{uniqueClasses.map(c=><option key={c} value={c}>Kl. {c} – {CLASS_NAMES[c]||c}</option>)}</select></div>
          </div>

          {dgSearch&&!dgSelected&&(<div style={{maxHeight:220,overflowY:"auto",border:"1px solid #ddd",borderRadius:8,marginBottom:14,background:"#fff"}}>
            {filteredDG.length===0&&<div style={{padding:14,color:"#999",fontSize:13}}>Ingen treff.</div>}
            {filteredDG.map((d,i)=>(
              <div key={`${d.un}-${d.name}-${i}`} className="dg-search-item" onClick={()=>{setDgSelected(d);setDgSearch(`${d.un} – ${d.nameNo}`);}} style={{background:i%2===0?"#fff":"#fafaf8"}}>
                <span style={{fontFamily:"monospace",fontWeight:800,fontSize:12,color:CLASS_COLORS[d.class]||"#333",minWidth:55}}>{d.un}</span>
                <span style={{fontSize:10,fontWeight:700,color:"#fff",background:CLASS_COLORS[d.class]||"#666",padding:"1px 5px",borderRadius:4}}>{d.class}</span>
                <span style={{fontSize:12,flex:1,minWidth:80}}>{d.nameNo}</span>
                {d.pg && <span style={{fontSize:9,fontWeight:700,color:"#fff",background:d.pg==="I"?"#c0392b":d.pg==="II"?"#e67e22":"#27ae60",padding:"0 5px",borderRadius:3}}>EG {d.pg}</span>}
                <span style={{fontSize:10,color:"#999"}}>Kat.{d.cat}</span>
              </div>
            ))}
          </div>)}

          {dgSelected&&(<div style={{background:"#f8f8f4",border:"1.5px solid #d4a017",borderRadius:8,padding:14,marginBottom:14}}>
            <div className="dg-sel-header">
              <span style={{fontFamily:"monospace",fontWeight:900,fontSize:16,color:CLASS_COLORS[dgSelected.class]}}>{dgSelected.un}</span>
              <span style={{fontSize:11,fontWeight:700,color:"#fff",background:CLASS_COLORS[dgSelected.class],padding:"2px 8px",borderRadius:4}}>Kl. {dgSelected.class}</span>
              {dgSelected.pg && <span style={{fontSize:10,fontWeight:700,color:"#fff",background:dgSelected.pg==="I"?"#c0392b":dgSelected.pg==="II"?"#e67e22":"#27ae60",padding:"2px 8px",borderRadius:4}}>EG {dgSelected.pg}</span>}
              <span style={{fontSize:12,fontWeight:700}}>{dgSelected.name}</span>
            </div>
            <div style={{fontSize:11,color:"#555",marginBottom:6}}>{CAT_LABELS[dgSelected.cat]}</div>
            <div style={{fontSize:11,color:"#555",marginBottom:10,lineHeight:1.5}}>
              <span style={{fontWeight:600}}>Emballasjegruppe:</span> {PG_INFO[dgSelected.pg]||PG_INFO[""]}
              {dgSelected.pg && <span> · Emb.instr.: {dgSelected.pi}</span>}
              {!dgSelected.pg && PG_CLASSES_WITHOUT.includes(dgSelected.class) && <span style={{color:"#777"}}> (kl. {dgSelected.class} bruker ikke EG)</span>}
              {!dgSelected.pg && !PG_CLASSES_WITHOUT.includes(dgSelected.class) && dgSelected.class==="9" && <span style={{color:"#777"}}> (regulert via særbestemmelser)</span>}
            </div>
            <div className="rg-dg-add">
              <div><label style={lb}>Antall</label><input style={inp0} type="number" min="1" value={dgQty} onChange={e=>setDgQty(e.target.value)}/></div>
              <div><label style={lb}>Netto/stk</label><input style={inp0} type="number" step="0.01" min="0.01" value={dgNetPer} onChange={e=>setDgNetPer(e.target.value)} placeholder="0.5"/></div>
              <div><label style={lb}>Enhet</label><select style={{...inp0,cursor:"pointer"}} value={dgUnit} onChange={e=>setDgUnit(e.target.value)}><option value="kg">kg</option><option value="L">liter</option></select></div>
              <div><label style={lb}>Beskrivelse</label><input style={inp0} value={dgDesc} onChange={e=>setDgDesc(e.target.value)}/></div>
              <button onClick={addDgItem} style={{background:"linear-gradient(135deg,#e5a100,#c89200)",color:"#1a1a2e",border:"none",borderRadius:6,padding:"9px 16px",cursor:"pointer",fontWeight:800,fontSize:13,whiteSpace:"nowrap",height:38}}>+ Legg til</button>
            </div>
            {dgSelected.cat===0&&<div style={{marginTop:10,padding:"8px 12px",background:"#f5c6cb",borderRadius:6,fontSize:12,fontWeight:600,color:"#c0392b"}}>⚠ Transportkategori 0 — full ADR gjelder uansett mengde.</div>}
            {dgWeightError&&<div style={{marginTop:10,padding:"8px 12px",background:"#fef2f2",border:"1.5px solid #e74c3c",borderRadius:6,fontSize:12,fontWeight:600,color:"#c0392b"}}>⚠ {dgWeightError}</div>}
            {totalBruttoGoods>0&&<div style={{marginTop:10,fontSize:11,color:"#777"}}>Brutto kolli: {totalBruttoGoods.toFixed(1)} kg · DG netto: {totalDgNetto.toFixed(2)} kg · Rest: {Math.max(0,totalBruttoGoods-totalDgNetto).toFixed(2)} kg</div>}
          </div>)}

          {dgItems.length>0&&(<>
            <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table className="dg-items-table" style={{minWidth:500}}><thead><tr style={{background:"#f4f4f0"}}>
              <th>UN</th><th>Stoff</th><th className="col-desk">Kl.</th><th className="col-desk">Kat.</th><th className="col-desk">×</th><th>Ant.</th><th>Netto</th><th>Poeng</th><th></th>
            </tr></thead>
            <tbody>{dgItems.map((it,i)=>(
              <tr key={i} style={{borderBottom:"1px solid #e4e4dc"}}>
                <td style={{fontFamily:"monospace",fontWeight:800,color:CLASS_COLORS[it.class]}}>{it.un}</td>
                <td style={{fontSize:11}}>{it.nameNo}{it.desc?` – ${it.desc}`:""}</td>
                <td className="col-desk"><span style={{fontSize:10,fontWeight:700,color:"#fff",background:CLASS_COLORS[it.class],padding:"1px 5px",borderRadius:3}}>{it.class}</span></td>
                <td className="col-desk" style={{fontWeight:700}}>{it.cat}</td>
                <td className="col-desk">×{it.cat===0?"∞":CAT_MULTIPLIERS[it.cat]}</td>
                <td>{it.qty} {it.unit}</td>
                <td>{it.totalQty.toFixed(2)}</td>
                <td style={{fontWeight:700,color:it.cat===0?"#c0392b":it.points>=333?"#e67e22":"#1e8449"}}>{it.cat===0?"∞":it.points.toFixed(1)}</td>
                <td><button onClick={()=>setDgItems(p=>p.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",color:"#c0392b",cursor:"pointer",fontSize:15,fontWeight:700}}>✕</button></td>
              </tr>
            ))}</tbody></table>
            </div>

            <div style={{marginTop:14,padding:"14px 18px",borderRadius:8,background:isExempt?"linear-gradient(135deg,#eafaf1,#d5f5e3)":"linear-gradient(135deg,#fdecea,#f5c6cb)",border:`2px solid ${isExempt?"#1e8449":"#c0392b"}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"#555"}}>Totalpoeng (ADR 1.1.3.6.4)</div>
                <div className="pts-val" style={{fontSize:26,fontWeight:900,color:isExempt?"#1e8449":"#c0392b"}}>{hasCat0?"∞ (Kat. 0)":totalDGPoints.toFixed(1)}</div>
                <div style={{fontSize:11,color:"#777",marginTop:2}}>{hasCat0?"Kategori 0 – ingen fritak":"×50 / ×3 / ×1 · Grense: 1000"}</div>
              </div>
              <div style={{padding:"8px 18px",borderRadius:6,fontWeight:700,fontSize:13,background:isExempt?"#1e8449":"#c0392b",color:"#fff"}}>{hasCat0?"⚠ Full ADR":isExempt?"✓ Fritatt":"⚠ Full ADR"}</div>
            </div>
          </>)}
        </div>

        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0 40px",gap:12}}>
          {tried && !validation.allOk && (
            <div style={{maxWidth:600,width:"100%",padding:"14px 20px",borderRadius:8,background:"#fef2f2",border:"1.5px solid #e74c3c",fontSize:13,color:"#c0392b"}}>
              <div style={{fontWeight:800,marginBottom:6,fontSize:14}}>Kan ikke generere fraktbrev</div>
              <div style={{lineHeight:1.7}}>
                {!validation.sec1Ok && <div>● Avsender: Firmanavn, adresse, postnr. og sted</div>}
                {!validation.sec2Ok && <div>● Mottaker: Firmanavn, adresse, postnr. og sted</div>}
                {!validation.sec3Ok && <div>● Fraktdetaljer: Dato og transportør</div>}
                {!validation.sec4Ok && <div>● Kolli: Minst én linje med antall og bruttovekt</div>}
                {!validation.sec5Ok && validation.dgItems && <div>● Farlig gods: Legg til minst 1 ADR-vare</div>}
                {validation.weightOverflow && <div>● Nettovekt DG overskrider bruttovekt kolli</div>}
              </div>
            </div>
          )}
          <button className="gen-btn" onClick={handleGenerate} style={{
            background:"linear-gradient(135deg,#e5a100,#c89200)",color:"#1a1a2e",
            border:"none",borderRadius:10,padding:"16px 48px",fontWeight:900,
            fontSize:17,cursor:"pointer",letterSpacing:0.8,boxShadow:"0 4px 16px rgba(229,161,0,0.3)",
            opacity:tried&&!validation.allOk?0.85:1,width:"100%",maxWidth:400,
          }}>Generer fraktbrev →</button>
        </div>
      </div>
    </div>
  );
}
