import { ExternalLink } from "@/app/ui/external-link";
import React from "react";

export default function Page() {
  return (
    <div className="flex flex-col justify-between p-12 sm:p-16 h-full">
      <div className="flex flex-col space-y-4">
        <p>
          I am a self-taught software developer living in south-western Ontario.
          I know a variety of programming languages and do both full stack and
          embedded development. I&apos;ve worked as a full stack developer for
          two years for{" "}
          <ExternalLink href="https://encircleapp.com">Encircle</ExternalLink>,
          and can provide references from them. I also do electrical engineering
          (messing around with Arduinos and robots) and machine learning
          projects as a hobby.
        </p>
        <div>
          <p>I&apos;m a fast learner and adapt quickly to new situations.</p>
          <p>I have helped bring new developers up to speed in the past.</p>
          <p>
            I have professional experience working in a collaborative SCRUM
            environment.
          </p>
        </div>

        <p>
          For a quick overview of where I am with my skill set, check out
          my&nbsp;
          <ExternalLink href="https://app.pluralsight.com/profile/quinn-neufeld">
            Pluralsight profile
          </ExternalLink>
          .
        </p>
      </div>

      <p>Looking for work :)</p>
    </div>
  );
}
