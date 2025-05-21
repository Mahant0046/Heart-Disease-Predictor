// src/components/admin/ResourceFormModal.tsx
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Resource } from '../../services/api'; // Assuming ResourceFormData is for this form

// Define the shape of form data for creating/editing resources
export interface ResourceModalFormData {
    title: string;
    description: string;
    category: string;
    url: string;
    imageUrl?: string;
    content?: string;
}

interface ResourceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ResourceModalFormData) => Promise<void>; // onSubmit now takes ResourceModalFormData
    initialData?: Resource | null; // For editing
    mode: 'create' | 'edit';
}

const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode
}) => {
    const [formData, setFormData] = useState<ResourceModalFormData>({
        title: '',
        description: '',
        category: 'article', // Default category
        url: '',
        imageUrl: '',
        content: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                category: initialData.category || 'article',
                url: initialData.url || '',
                imageUrl: initialData.imageUrl || '',
                content: initialData.content || '',
            });
        } else {
            // Reset for create mode or if initialData is null
            setFormData({
                title: '', description: '', category: 'article', url: '',
                imageUrl: '', content: ''
            });
        }
    }, [isOpen, initialData, mode]); // Depend on isOpen to reset form when modal reopens

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await onSubmit(formData); // Pass the current formData
        setIsSubmitting(false);
        // onClose(); // onSubmit in AdminDashboard will call closeModal on success
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        {mode === 'create' ? 'Add New Resource' : 'Edit Resource'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows={3}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                            <select name="category" id="category" value={formData.category} onChange={handleChange} required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                <option value="article">Article</option>
                                <option value="blog">Blog Post</option>
                                <option value="video">Video</option>
                                <option value="tool">Tool</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="url" className="block text-sm font-medium text-gray-700">URL</label>
                            <input type="url" name="url" id="url" value={formData.url} onChange={handleChange} required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Image URL (Optional)</label>
                            <input type="url" name="imageUrl" id="imageUrl" value={formData.imageUrl} onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                         <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700">Full Content (Optional)</label>
                            <textarea name="content" id="content" value={formData.content} onChange={handleChange} rows={5}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div className="items-center px-4 py-3 space-x-2">
                            <button type="submit" disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-auto hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                                {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Resource' : 'Save Changes')}
                            </button>
                            <button type="button" onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-auto hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResourceFormModal;