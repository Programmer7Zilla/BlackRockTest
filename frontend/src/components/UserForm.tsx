import React, { useState, useEffect } from 'react';
import { User, CreateUserRequest, FormErrors } from '../types/User';
import './UserForm.css';

interface UserFormProps {
  onSubmit: (userData: CreateUserRequest) => Promise<void>;
  editingUser: User | null;
  onCancel: () => void;
  loading: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ 
  onSubmit, 
  editingUser, 
  onCancel, 
  loading 
}) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    name: '',
    surname: '',
    email: '',
    company: '',
    jobTitle: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name,
        surname: editingUser.surname,
        email: editingUser.email,
        company: editingUser.company,
        jobTitle: editingUser.jobTitle
      });
    } else {
      setFormData({
        name: '',
        surname: '',
        email: '',
        company: '',
        jobTitle: ''
      });
    }
    setErrors({});
  }, [editingUser]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }

    // Surname validation
    if (!formData.surname.trim()) {
      newErrors.surname = 'Surname is required';
    } else if (formData.surname.trim().length < 2) {
      newErrors.surname = 'Surname must be at least 2 characters long';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.surname.trim())) {
      newErrors.surname = 'Surname can only contain letters, spaces, hyphens, and apostrophes';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
      }
    }

    // Company validation
    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    } else if (formData.company.trim().length < 2) {
      newErrors.company = 'Company name must be at least 2 characters long';
    }

    // Job Title validation
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    } else if (formData.jobTitle.trim().length < 2) {
      newErrors.jobTitle = 'Job title must be at least 2 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFieldValidationStatus = (fieldName: keyof CreateUserRequest) => {
    const value = formData[fieldName];
    if (!value.trim()) return 'empty';
    
    switch (fieldName) {
      case 'name':
      case 'surname':
        if (value.trim().length < 2) return 'invalid';
        if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return 'invalid';
        return 'valid';
      case 'email':
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(value.trim()) ? 'valid' : 'invalid';
      case 'company':
      case 'jobTitle':
        return value.trim().length >= 2 ? 'valid' : 'invalid';
      default:
        return 'empty';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(formData);
      if (!editingUser) {
        // Reset form only for new users
        setFormData({
          name: '',
          surname: '',
          email: '',
          company: '',
          jobTitle: ''
        });
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      surname: '',
      email: '',
      company: '',
      jobTitle: ''
    });
    setErrors({});
    onCancel();
  };

  return (
    <div className="form-container">
      <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
      
      {editingUser && (
        <div className="editing-info">
          <span className="editing-label">Editing User:</span>
          <span className="editing-uuid" title={`Full UUID: ${editingUser.uuid}`}>
            {editingUser.uuid.substring(0, 8)}...
          </span>
        </div>
      )}
      
      {errors.general && (
        <div className="error-message general-error">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={errors.name ? 'error' : getFieldValidationStatus('name') === 'valid' ? 'valid' : getFieldValidationStatus('name') === 'invalid' ? 'invalid' : ''}
            placeholder="Enter first name (letters only)"
            disabled={isSubmitting || loading}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="surname">Surname *</label>
          <input
            type="text"
            id="surname"
            name="surname"
            value={formData.surname}
            onChange={handleInputChange}
            className={errors.surname ? 'error' : getFieldValidationStatus('surname') === 'valid' ? 'valid' : getFieldValidationStatus('surname') === 'invalid' ? 'invalid' : ''}
            placeholder="Enter last name (letters only)"
            disabled={isSubmitting || loading}
          />
          {errors.surname && <span className="error-message">{errors.surname}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={errors.email ? 'error' : getFieldValidationStatus('email') === 'valid' ? 'valid' : getFieldValidationStatus('email') === 'invalid' ? 'invalid' : ''}
            placeholder="Enter valid email (e.g., user@example.com)"
            disabled={isSubmitting || loading}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="company">Company *</label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            className={errors.company ? 'error' : getFieldValidationStatus('company') === 'valid' ? 'valid' : getFieldValidationStatus('company') === 'invalid' ? 'invalid' : ''}
            placeholder="Enter company name"
            disabled={isSubmitting || loading}
          />
          {errors.company && <span className="error-message">{errors.company}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="jobTitle">Job Title *</label>
          <input
            type="text"
            id="jobTitle"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleInputChange}
            className={errors.jobTitle ? 'error' : getFieldValidationStatus('jobTitle') === 'valid' ? 'valid' : getFieldValidationStatus('jobTitle') === 'invalid' ? 'invalid' : ''}
            placeholder="Enter job title"
            disabled={isSubmitting || loading}
          />
          {errors.jobTitle && <span className="error-message">{errors.jobTitle}</span>}
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}
          </button>
          
          {editingUser && (
            <button 
              type="button" 
              className="cancel-btn"
              onClick={handleCancel}
              disabled={isSubmitting || loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserForm;
