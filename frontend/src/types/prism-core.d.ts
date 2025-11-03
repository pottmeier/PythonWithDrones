declare module "prismjs/components/prism-core" {
  export function highlight(code: string, language: string): string;
  export const languages: any;
}
