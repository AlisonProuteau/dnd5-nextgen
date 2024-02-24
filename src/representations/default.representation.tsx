export interface DefaultInstance {
  index: string;
  name: string;
}

export interface OptionChoices {
  desc: string;
  choose: number;
  type: string;
  from: { options: [{ item: DefaultInstance }] };
}
