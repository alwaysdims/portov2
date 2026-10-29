import {
  HiBolt,
  HiHeart,
  HiClock,
  HiEnvelope,
  HiDocumentDuplicate,
  HiFire,
  HiSun,
  HiShieldCheck,
  HiSparkles,
} from "react-icons/hi2";
import { FaHandFist } from "react-icons/fa6";

export function UpgradeIcon({ id, className = "w-8 h-8 text-amber-400" }) {
  switch (id) {
    case "damage":
      return <FaHandFist className={className} />;
    case "attackSpeed":
      return <HiBolt className={className} />;
    case "maxHp":
      return <HiHeart className={className} />;
    case "cooldownReduction":
      return <HiClock className={className} />;
    case "suratPecah":
      return <HiEnvelope className={className} />;
    case "badaiSurat":
      return <HiDocumentDuplicate className={className} />;
    case "orasiMembara":
      return <HiFire className={className} />;
    case "fajarBangkit":
      return <HiSun className={className} />;
    case "pantangMundur":
      return <HiShieldCheck className={className} />;
    default:
      return <HiSparkles className={className} />;
  }
}
