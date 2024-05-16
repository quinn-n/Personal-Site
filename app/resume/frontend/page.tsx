import { ExternalLink } from "@/app/ui/external-link"
import { SkillPage } from "@/app/ui/resume/skill-page"

export default function Page() {
  return <SkillPage professionalExperience={2} personalExperience={3} pluralsightIQ={206} >
    <p>
      The Pluralsight IQ score is taken from my NextJS score.
    </p>
    <p>
      I have some experience with frontend development. I did some frontend work using React, TypeScript,
      Less and some libraries like rxjs at&nbsp;
      <ExternalLink href="https://encircleapp.com">my last job</ExternalLink>
      , though I had a greater focus on the backend while I worked there.
      I&apos;ve been studying up on frontend development since, and I&apos;ve been working on&nbsp;
      <ExternalLink href="https://github.com/quinn-n/Personal-Site">this site</ExternalLink>
      &nbsp;which is built using the NextJS framework as a way to practice.
    </p>
    <p>
      I am by no means a designer, but I can make a functional site on my own (as evidenced by this site)
      and can implement designs given to me. I would like to learn the basics of design one day so that I can make nice sites on my own
      but I have higher priorities right now.
    </p>
  </SkillPage>;
}
