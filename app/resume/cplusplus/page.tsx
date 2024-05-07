import { SkillPage } from "@/app/ui/resume/skill-page";
import Link from "next/link";

export default function Page() {
  return <SkillPage professionalExperience={0} personalExperience={5} pluralsightIQ={123}>
    <p>
      I&apos;ve used C++ for a couple of personal projects, including a lot of Arduino projects such as a&nbsp;
      <Link className="link-text" href="https://github.com/quinn-n/Helldivers-2-Strategem-Controller">hardware controller to call in Helldivers 2 strategems</Link>
      , some fancy <Link className="link-text" href="https://github.com/quinn-n/Christmas_Lights">christmas lights</Link>
      &nbsp;and a custom <Link className="link-text" href="https://github.com/quinn-n/Thermometer">thermometer</Link>.
    </p>
    <p>
      I&apos;ve also used it for a few desktop applications. Most have been lost to time, but I still have the source code for a&nbsp;
      <Link className="link-text" href="https://github.com/quinn-n/Recursive-Function-Calculator">calculator which can calculate recursive mathematical functions</Link>.
    </p>
  </SkillPage>;
}
