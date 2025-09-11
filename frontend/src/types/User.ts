export interface User {
  uuid: string;
  name: string;
  surname: string;
  email: string;
  company: string;
  jobTitle: string;
}

export interface CreateUserRequest {
  name: string;
  surname: string;
  email: string;
  company: string;
  jobTitle: string;
}

export interface ApiResponse<T> {
  users?: T[];
  error?: string;
  message?: string;
}

export interface FormErrors {
  name?: string;
  surname?: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  general?: string;
}
