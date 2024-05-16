import { ExternalLink } from "@/app/ui/external-link";
import { SkillPage } from "@/app/ui/resume/skill-page";

export default function Page() {
  const date = new Date();
  return <SkillPage professionalExperience={0} personalExperience={date.getFullYear() - 2017}>
    <p>
      I started out on my <ExternalLink href="https://www.firstinspires.org/robotics/frc">high school&apos;s FRC team</ExternalLink>
      , where I <ExternalLink href="https://github.com/quinn-n/FRC-Robotpy">programmed our robot in Python</ExternalLink>
      &nbsp;to use various sensors and actuators to move and complete tasks. I also worked on the hardware side of things, as we were
      a small team and a few of us had to wear multiple hats. It was also a high pressure environment, as our robot only ever got
      finally assembled at the competition. It&apos;s not very easy to write software for a constantly changing robot that doesn&apos;t
      exist yet, much less trying to debug it! I remember having to deploy code to the robot while it was on the field once, seconds
      before the match started. But all in all it was really fun and I learned a lot.
    </p>
    <p>
      I&apos;ve since taken up a few smaller personal projects in C++ and Python, including a&nbsp;
      <ExternalLink href="https://github.com/quinn-n/Thermometer">thermometer which can change its target temperature depending on the time of day</ExternalLink>
      , and a <ExternalLink href="https://github.com/quinn-n/Helldivers-2-Strategem-Controller">custom input device for helldivers 2</ExternalLink>.
      I&apos;ve also been working on and off on a FOSS framework in Python for making robots with Raspberry Pis which communicate with a remote
      driver&apos;s station over the internet, but that project is still in its infancy and not on Github yet. Feel free to ask me about trying
      to pass data between threads in Python, or trying to get tkinter to display opencv2 frames. Two things which sound really easy
      but are actually really frustrating.
    </p>
  </SkillPage>
}
