import { useState, useEffect } from 'react';
import { plantsService } from '../../services/api';
import toast from 'react-hot-toast';

const PlantManagement = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    scientificName: '',
    subtype: '',
    cost: '',
    availableQuantity: '',
    description: ''
  });

  const fetchPlants = async () => {
    try {
      const result = await plantsService.getAll(page);
      setPlants(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error('Failed to fetch plants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, [page]);

  const handleAddPlant = async (e) => {
    e.preventDefault();
    try {
      await plantsService.add(formData);
      toast.success('Plant added successfully');
      setShowAddModal(false);
      setFormData({
        name: '',
        scientificName: '',
        subtype: '',
        cost: '',
        availableQuantity: '',
        description: ''
      });
      fetchPlants();
    } catch (error) {
      toast.error(error.message || 'Failed to add plant');
    }
  };

  const handleEditPlant = async (e) => {
    e.preventDefault();
    try {
      await plantsService.update(selectedPlant._id, formData);
      toast.success('Plant updated successfully');
      setShowEditModal(false);
      setSelectedPlant(null);
      fetchPlants();
    } catch (error) {
      toast.error(error.message || 'Failed to update plant');
    }
  };

  const handleDeletePlant = async (id) => {
    if (window.confirm('Are you sure you want to delete this plant?')) {
      try {
        await plantsService.delete(id);
        toast.success('Plant deleted successfully');
        fetchPlants();
      } catch (error) {
        toast.error(error.message || 'Failed to delete plant');
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await plantsService.uploadCosts(file);
        toast.success('Plant costs updated successfully');
        fetchPlants();
      } catch (error) {
        toast.error(error.message || 'Failed to upload plant costs');
      }
    }
  };

  const updateQuantity = async (id, change) => {
    try {
      await plantsService.updateQuantity(id, change);
      toast.success('Quantity updated successfully');
      fetchPlants();
    } catch (error) {
      toast.error(error.message || 'Failed to update quantity');
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Plant Management</h1>
          <div className="flex space-x-4">
            <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 cursor-pointer">
              <span>Upload Excel</span>
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
              />
            </label>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Add Plant
            </button>
          </div>
        </div>

        {/* Plants Table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Name
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Scientific Name
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Subtype
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Cost
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Available Quantity
                      </th>
                      <th className="relative px-3 py-3.5">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {plants.map((plant) => (
                      <tr key={plant._id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {plant.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {plant.scientificName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {plant.subtype}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          ₹{plant.cost.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(plant._id, -1)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              -
                            </button>
                            <span>{plant.availableQuantity}</span>
                            <button
                              onClick={() => updateQuantity(plant._id, 1)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="relative whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedPlant(plant);
                              setFormData({
                                name: plant.name,
                                scientificName: plant.scientificName,
                                subtype: plant.subtype,
                                cost: plant.cost,
                                availableQuantity: plant.availableQuantity,
                                description: plant.description?.en || ''
                              });
                              setShowEditModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePlant(plant._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex justify-center">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Next
            </button>
          </nav>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={showAddModal ? handleAddPlant : handleEditPlant}>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {showAddModal ? 'Add New Plant' : 'Edit Plant'}
                  </h3>
                  <div className="mt-2 space-y-4">
                    {/* Form fields */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                        required
                      />
                    </div>
                    {/* Add other form fields similarly */}
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {showAddModal ? 'Add' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedPlant(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantManagement;