// types/auth.ts

export interface AuthResponseData {
  token: string;
  fullName: string;
  cpf?: string;
  username: string;
  email?: string;
  role: string;
}