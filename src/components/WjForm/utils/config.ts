import {
  Button,
  Col,
  Form,
  Row,
  Space,
  Input,
  Select,
  InputNumber,
  Card,
  DatePicker,
  TimePicker,
  Radio,
  Slider,
  Rate,
  Mentions,
  Switch,
} from "antd";

export type ComponentsType = {
  card: typeof Card;
  space: typeof Space;
  col: typeof Col;
  row: typeof Row;
  button: typeof Button;
  formitem: typeof Form.Item;
  wjfrom: typeof Form;
  search: typeof Input.Search;
  select: typeof Select;
  textarea: typeof Input.TextArea;
  input: typeof Input;
  number: typeof InputNumber;
  password: typeof Input.Password;
  date: typeof DatePicker;
  time: typeof TimePicker;
  radio: typeof Radio.Group;
  slider: typeof Slider;
  rate: typeof Rate;
  mentions: typeof Mentions;
  switch: typeof Switch;
};

const components: ComponentsType = {
  card: Card,
  space: Space,
  col: Col,
  row: Row,
  button: Button,
  formitem: Form.Item,
  wjfrom: Form,
  search: Input,
  select: Select,
  textarea: Input.TextArea,
  input: Input,
  number: InputNumber,
  password: Input.Password,
  date: DatePicker,
  time: TimePicker,
  radio: Radio.Group,
  slider: Slider,
  rate: Rate,
  mentions: Mentions,
  switch: Switch,
};

export default components;
