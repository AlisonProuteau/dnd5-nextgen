export interface DefaultInstance {
  index: string;
  name: string;
}

export interface OptionChoices {
  desc: string;
  choose: number;
  type: string;
  from: { options: OptionFrom[] };
}

export interface OptionFrom {
  item?: DefaultInstance;
  choice?: OptionChoices;
}
