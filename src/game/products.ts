import amnesiaIcon from "@/assets/products/amnesia.png";
import profsKushIcon from "@/assets/products/profs-kush.png";
import notteEsamiIcon from "@/assets/products/notte-esami.png";
import mathMollyIcon from "@/assets/products/math-molly.png";
import nonSoNienteIcon from "@/assets/products/non-so-niente.png";
import gpaGreenoutIcon from "@/assets/products/gpa-greenout.png";
import lateLatteIcon from "@/assets/products/late-latte.png";
import cartineIcon from "@/assets/products/cartine.png";
import bongIstitutoIcon from "@/assets/products/bong-istituto.png";

export type ProductCategory = "erbe" | "pasticche" | "gadget";

export interface Product {
  id: string;
  name: string;
  /** Codice ironico in stile darknet */
  codename: string;
  category: ProductCategory;
  /** Prezzo base in CoperniCoin */
  basePrice: number;
  /** Rischio 1..10: quanto fa salire il sospetto per ogni unità venduta */
  risk: number;
  /** Quanto piace di base (1..10) */
  demand: number;
  description: string;
  /** Icona pixel art (PNG transparent) */
  icon: string;
}

export const PRODUCTS: Product[] = [
  // 🍁 ERBE
  {
    id: "amnesia_interrogazione",
    name: "Amnesia da Interrogazione",
    codename: "sativa.flush()",
    category: "erbe",
    basePrice: 6,
    risk: 6,
    demand: 8,
    description: "Ti cancella l'ansia, ma anche le ultime 48h di studio.",
    icon: amnesiaIcon,
  },
  {
    id: "profs_kush",
    name: "Prof's Kush",
    codename: "philo.bud",
    category: "erbe",
    basePrice: 8,
    risk: 7,
    demand: 7,
    description: "Coltivata nel giardino dal prof di filosofia. Senso della vita incluso.",
    icon: profsKushIcon,
  },
  {
    id: "notte_esami",
    name: "Notte Prima degli Esami",
    codename: "indica.sleep",
    category: "erbe",
    basePrice: 7,
    risk: 5,
    demand: 9,
    description: "Sonno profondo istantaneo. Smetti di piangere sul libro di storia.",
    icon: notteEsamiIcon,
  },
  // 💊 PASTICCHE
  {
    id: "math_magic_molly",
    name: "Math-Magic Molly",
    codename: "pi.exe",
    category: "pasticche",
    basePrice: 10,
    risk: 8,
    demand: 7,
    description: "Calcoli pi greco in 0.4s. Tremi come un frullatore: feature, non bug.",
    icon: mathMollyIcon,
  },
  {
    id: "non_so_niente",
    name: 'La "Non So Niente"',
    codename: "placebo.null",
    category: "pasticche",
    basePrice: 2,
    risk: 1,
    demand: 6,
    description: "Microdosaggio di puro placebo. Non fa niente ma ti rassicura.",
    icon: nonSoNienteIcon,
  },
  {
    id: "gpa_greenout",
    name: "G.P.A. Greenout",
    codename: "radioactive.drink",
    category: "pasticche",
    basePrice: 5,
    risk: 4,
    demand: 8,
    description: "Energy verde radioattivo. +50% focus, +100% battiti.",
    icon: gpaGreenoutIcon,
  },
  // 🎒 GADGET
  {
    id: "late_pass_latte",
    name: "The Late-Pass Latte",
    codename: "wakeup.sh --force",
    category: "gadget",
    basePrice: 4,
    risk: 2,
    demand: 9,
    description: "Caffè corretto: dalle 7:55 in classe alle 8:00 sveglio.",
    icon: lateLatteIcon,
  },
  {
    id: "cartine_cattedra",
    name: "Cartine a Righe della Cattedra",
    codename: "cheat.paper",
    category: "gadget",
    basePrice: 3,
    risk: 5,
    demand: 7,
    description: "Cartine speciali per rollare... i bigliettini del compito.",
    icon: cartineIcon,
  },
  {
    id: "bong_istituto",
    name: "Bong d'Istituto",
    codename: "lab.microscope.mod",
    category: "gadget",
    basePrice: 15,
    risk: 9,
    demand: 6,
    description: "Microscopio del laboratorio di scienze, riassemblato autogestito.",
    icon: bongIstitutoIcon,
  },
];

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  erbe: "// relaxants",
  pasticche: "// stimulants",
  gadget: "// focus aids",
};
