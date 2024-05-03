

// TODO: Add certs and projects
export function SkillPage(props: { children?: React.ReactNode, professionalExperience: number, personalExperience: number, pluralsightIQ?: number }) {
  return <div className="flex flex-col p-16">
    <h1>{props.professionalExperience} years of professional experience</h1>
    <h1>{props.personalExperience} years personal / hobbyist experience</h1>
    {props.pluralsightIQ? <h1>Pluralsight IQ of {props.pluralsightIQ}</h1> : undefined}
    <div>
      {props.children}
    </div>
  </div>;
}
