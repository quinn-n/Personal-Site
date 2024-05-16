import { ExternalLink } from "@/app/ui/external-link";
import { SkillPage } from "@/app/ui/resume/skill-page";
import React from "react";

export default function Page() {
  const date = new Date();
  return (
    <SkillPage
      personalExperience={date.getFullYear() - 2013}
      professionalExperience={0}
    >
      <p>
        I first got into software development ~{date.getFullYear() - 2013} years
        ago writing Lua applications for&nbsp;
        <ExternalLink href="https://tweaked.cc/">ComputerCraft</ExternalLink>, a
        Minecraft mod that adds programmable computers to the game. I&apos;ve
        long since lost the code for those projects, but I have&nbsp;
        <ExternalLink href="https://github.com/quinn-n/OpenComputers">
          some more recent Lua projects
        </ExternalLink>
        &nbsp;written for a similar mod called{" "}
        <ExternalLink href="https://www.curseforge.com/minecraft/mc-mods/opencomputers">
          OpenComputers
        </ExternalLink>
        .
      </p>
    </SkillPage>
  );
}
