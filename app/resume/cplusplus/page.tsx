import { ExternalLink } from "@/app/ui/external-link";
import { SkillPage } from "@/app/ui/resume/skill-page";
import React from "react";

export default function Page() {
  return (
    <SkillPage
      professionalExperience={0}
      personalExperience={5}
      pluralsightIQ={173}
    >
      <p>
        I&apos;ve used C++ for a couple of personal projects, including a lot of
        Arduino projects such as a&nbsp;
        <ExternalLink href="https://github.com/quinn-n/Helldivers-2-Strategem-Controller">
          hardware controller to call in Helldivers 2 strategems
        </ExternalLink>
        , some fancy{" "}
        <ExternalLink href="https://github.com/quinn-n/Christmas_Lights">
          christmas lights
        </ExternalLink>
        &nbsp;and a custom{" "}
        <ExternalLink href="https://github.com/quinn-n/Thermometer">
          thermometer
        </ExternalLink>
        .
      </p>
      <p>
        I&apos;ve also used it for a few desktop applications. Most have been
        lost to time, but I still have the source code for a&nbsp;
        <ExternalLink href="https://github.com/quinn-n/Recursive-Function-Calculator">
          calculator which can calculate recursive mathematical functions
        </ExternalLink>
        .
      </p>
    </SkillPage>
  );
}
