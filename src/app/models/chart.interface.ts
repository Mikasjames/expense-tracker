export interface PieData {
  name: string;
  value: number;
}

export interface LineBarData {
  tag: number;
  value: [string, number];
  title: string;
}

export interface SortedByDayLineBarData {
  value: [number, number];
  points: Point[];
}

export interface GroupedData {
  [key: string]: Point[];
}

export interface GroupedPointsByTags {
  [key: number]: { tag: number; points: TitleValue[] };
}

export interface Image {
  id: number;
  image_name: string;
  image: string;
}

export interface Account {
  username: string;
  user_id: number;
  display_picture_id: number;
  is_super_user: boolean;
}

export interface Money {
  id: number;
  title: string;
  amount: number;
  date: string;
  notes: string;
  created_on: string;
  updated_on: string;
  user: number;
  tags: number[];
}

export interface Tag {
  id: number;
  name: string;
  user: number;
}

export interface Point extends TitleValue {
  tag: number;
}

export interface TitleValue {
  title: string;
  value: number;
}
