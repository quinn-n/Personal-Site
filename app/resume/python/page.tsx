import { Certification } from "@/app/ui/resume/certification";
import { SkillPage } from "@/app/ui/resume/skill-page";
import Link from "next/link";

export default function Page() {
  return <SkillPage professionalExperience={2} personalExperience={7} pluralsightIQ={221}>
    <p>
      I&apos;ve used Python professionally to build private and public REST APIs with Tornado and SQLAlchemy.
      I&apos;ve used it for a huge number of personal projects and scripts, from&nbsp;
      <Link className="link-text" href="https://github.com/quinn-n/pip-search">small(ish) but useful scripts</Link>
      , to <Link className="link-text" href="https://github.com/quinn-n/worm">recreations of old games</Link>
      , to <Link className="link-text" href="https://github.com/quinn-n/NSFW_Detection_API">REST APIs written with FastAPI</Link>.
    </p>
    <div className="py-16 space-x-16 flex justify-start">
      <Certification
        title="Python Institute PCEP"
        imageURL="/certifications/entry level python certificate.png"
        link="https://verify.openedg.org/?id=fB8N.HqYR.pP0U"
      />
    </div>
  </SkillPage>;
}
