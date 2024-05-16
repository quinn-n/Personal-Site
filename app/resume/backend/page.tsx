import { ExternalLink } from "@/app/ui/external-link";
import { SkillPage } from "@/app/ui/resume/skill-page";
import React from "react";

export default function Page() {
  const date = new Date();
  return (
    <SkillPage
      professionalExperience={2023 - 2021}
      personalExperience={date.getFullYear() - 2013}
      pluralsightIQ={221}
    >
      <div>
        <p>
          I&apos;ve lumped my time spent building console applications in with
          my personal experience here because the logic past the interface is so
          similar and the two are often intertwined.
        </p>
        <p>
          Almost all of my experience with REST APIs has been with Python.
          I&apos;ve built private and public REST APIs with Tornado and FastAPI.
          I used Tornado at{" "}
          <ExternalLink href="https://encircleapp.com">Encircle</ExternalLink>{" "}
          and FastAPI is what I usually use for personal projects. I&apos;ve
          used SQLAlchemy for all my database interaction in Python, and
          I&apos;ve used Alembic to manage database migrations. I also have some
          experience with multiprocessing in Python and C++ as well as Lua
          coroutines.
        </p>
      </div>
    </SkillPage>
  );
}
