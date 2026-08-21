import { apiRequest } from "./client";

export interface Company {
  cid: number;
  company_name: string;
}

export interface GetCompaniesResponse {
  companies: Company[];
  total: number;
}

export interface CreateCompanyData {
  company_name: string;
}

export interface UpdateCompanyData {
  company_name: string;
}

/**
 * Get all companies
 */
export async function getCompanies() {
  return apiRequest<GetCompaniesResponse>(
    "/api/getcompanies"
  );
}

/**
 * Get single company
 */
export async function getCompany(cid: number) {
  return apiRequest<Company>(
    `/api/getcompany/${cid}`
  );
}

/**
 * Create company
 */
export async function createCompany(
  data: CreateCompanyData
) {
  return apiRequest<Company>(
    "/api/createcompany",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Update company
 */
export async function updateCompany(
  cid: number,
  data: UpdateCompanyData
) {
  return apiRequest<Company>(
    `/api/updatecompany/${cid}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete company
 */
export async function deleteCompany(
  cid: number
) {
  return apiRequest<string>(
    `/api/deletecompany/${cid}`,
    {
      method: "DELETE",
    }
  );
}