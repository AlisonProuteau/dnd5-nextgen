export interface DefaultInstance {
  index: string;
  name: string;
}

export interface OptionChoices {
  desc: string;
  choose: number;
  type: string;
  from: { option_set_type: string; options: [{ item: [DefaultInstance]; option_type: string }] };
}
