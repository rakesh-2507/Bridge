import { del, get, post, put } from "./http";

export interface Company {
  cid: number;
  company_name: string;
}

export interface CompanyPayload {
  company_name: string;
}

export interface CompaniesResponse {
  companies: Company[];
  total: number;
}

export function getCompanies<T = CompaniesResponse>(): Promise<T> {
  return get<T>("/getcompanies");
}

export function getCompany<T = Company>(
  cid: string | number,
): Promise<T> {
  return get<T>(`/getcompany/${encodeURIComponent(String(cid))}`);
}

export function createCompany<T = Company>(
  payload: CompanyPayload,
): Promise<T> {
  return post<T>("/createcompany", payload);
}

export function updateCompany<T = Company>(
  cid: string | number,
  payload: CompanyPayload,
): Promise<T> {
  return put<T>(
    `/updatecompany/${encodeURIComponent(String(cid))}`,
    payload,
  );
}

export function deleteCompany<T = string>(
  cid: string | number,
): Promise<T> {
  return del<T>(`/deletecompany/${encodeURIComponent(String(cid))}`);
}
