export interface MenuItem {
  label: string;
  icon?: any;
  route?: string;
  children?: MenuItem[];
  roles?: string[];
}
