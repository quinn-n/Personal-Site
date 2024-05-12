import { SkillPage } from "@/app/ui/resume/skill-page";

export default function Page() {
  return <SkillPage professionalExperience={0} personalExperience={5} pluralsightIQ={123}>
    <p>
      I&apos;ve used C++ for a couple of personal projects, including a lot of Arduino projects such as a&nbsp;
      <a rel="noopener noreferrer" className="link-text" href="https://github.com/quinn-n/Helldivers-2-Strategem-Controller">hardware controller to call in Helldivers 2 strategems</a>
      , some fancy <a rel="noopener noreferrer" className="link-text" href="https://github.com/quinn-n/Christmas_Lights">christmas lights</a>
      &nbsp;and a custom <a rel="noopener noreferrer" className="link-text" href="https://github.com/quinn-n/Thermometer">thermometer</a>.
    </p>
    <p>
      I&apos;ve also used it for a few desktop applications. Most have been lost to time, but I still have the source code for a&nbsp;
      <a rel="noopener noreferrer" className="link-text" href="https://github.com/quinn-n/Recursive-Function-Calculator">calculator which can calculate recursive mathematical functions</a>.
    </p>
  </SkillPage>;
}
