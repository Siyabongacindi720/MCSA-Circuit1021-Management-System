import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for authentication
const AuthContext = React.createContext();

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { username, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = React.useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(username, password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center" 
         style={{
           backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1717354577029-e26e20037e57")'
         }}>
      <div className="bg-white bg-opacity-95 p-8 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="mb-4">
            <img 
              src="https://images.unsplash.com/photo-1622294172324-5d95fecd7bfc" 
              alt="MCSA Logo" 
              className="h-16 w-16 mx-auto rounded-full object-cover shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            MCSA Highveld Ridge Circuit 1021
          </h1>
          <p className="text-sm text-gray-600">Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500">
          System created by Siyabonga Cindi
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = React.useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/stats/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const societies = [
    { name: 'Embalenhle', key: 'embalenhle' },
    { name: 'Secunda', key: 'secunda' },
    { name: 'Evander', key: 'evander' },
    { name: 'KMT', key: 'kmt' },
    { name: 'Ebenezer', key: 'ebenezer' },
    { name: 'eMzinoni', key: 'emzinoni' }
  ];

  const organizations = [
    { name: "Children's Ministry", key: 'childrens_ministry', logo: 'https://images.unsplash.com/photo-1728406970302-8be1af6bda4c' },
    { name: 'Junior Manyano', key: 'junior_manyano', logo: 'https://images.unsplash.com/photo-1622294172324-5d95fecd7bfc' },
    { name: 'Wesley Guild', key: 'wesley_guild', logo: 'https://images.unsplash.com/photo-1567852881436-690bddd2effd' },
    { name: "Young Men's Guild", key: 'young_mens_guild', logo: 'https://images.unsplash.com/photo-1728406970302-8be1af6bda4c' },
    { name: "Young Women's Manyano", key: 'young_womens_manyano', logo: 'https://images.unsplash.com/photo-1622294172324-5d95fecd7bfc' },
    { name: "Women's Manyano", key: 'womens_manyano', logo: 'https://images.unsplash.com/photo-1567852881436-690bddd2effd' },
    { name: "Women's Fellowship", key: 'womens_fellowship', logo: 'https://images.unsplash.com/photo-1728406970302-8be1af6bda4c' },
    { name: "Location Preacher's Association", key: 'location_preachers', logo: 'https://images.unsplash.com/photo-1622294172324-5d95fecd7bfc' },
    { name: 'Music Association (Church Choir)', key: 'music_association', logo: 'https://images.unsplash.com/photo-1567852881436-690bddd2effd' }
  ];

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" 
         style={{
           backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url("https://images.unsplash.com/photo-1670350440929-1298c7005c6c")'
         }}>
      {/* Header */}
      <div className="bg-white bg-opacity-95 shadow-lg backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="https://images.unsplash.com/photo-1622294172324-5d95fecd7bfc" 
                alt="MCSA Logo" 
                className="h-12 w-12 rounded-full object-cover shadow-md mr-4"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  MCSA Highveld Ridge Circuit 1021
                </h1>
                <p className="text-sm text-gray-600">Management Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-600 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-80 bg-white bg-opacity-95 rounded-2xl shadow-xl backdrop-blur-sm p-6">
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
                { id: 'members', label: 'Members', icon: '👥' },
                { id: 'finances', label: 'Finances', icon: '💰' },
                { id: 'organizations', label: 'Organizations', icon: '🏛️' },
                { id: 'announcements', label: 'Announcements', icon: '📢' },
                { id: 'files', label: 'Files', icon: '📁' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white bg-opacity-95 rounded-2xl shadow-xl backdrop-blur-sm p-8">
            {activeSection === 'overview' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Total Members</p>
                        <p className="text-3xl font-bold">{stats?.total_members || 0}</p>
                      </div>
                      <div className="text-4xl opacity-80">👥</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Societies</p>
                        <p className="text-3xl font-bold">{stats?.total_societies || 6}</p>
                      </div>
                      <div className="text-4xl opacity-80">🏛️</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100">Organizations</p>
                        <p className="text-3xl font-bold">{stats?.total_organizations || 9}</p>
                      </div>
                      <div className="text-4xl opacity-80">🌟</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Societies</h3>
                    <div className="space-y-3">
                      {societies.map((society) => (
                        <div key={society.key} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                          <span className="font-medium text-gray-900">{society.name}</span>
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {stats?.members_by_society?.[society.key] || 0} members
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => setActiveSection('members')}
                        className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">👤</span>
                          <span className="font-medium">Add New Member</span>
                        </div>
                        <span className="text-gray-400">→</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveSection('finances')}
                        className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">💰</span>
                          <span className="font-medium">Record Financial Entry</span>
                        </div>
                        <span className="text-gray-400">→</span>
                      </button>
                      
                      <button
                        onClick={() => setActiveSection('announcements')}
                        className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">📢</span>
                          <span className="font-medium">Create Announcement</span>
                        </div>
                        <span className="text-gray-400">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'members' && <MembersSection />}
            {activeSection === 'finances' && <FinancesSection societies={societies} />}
            {activeSection === 'organizations' && <OrganizationsSection organizations={organizations} />}
            {activeSection === 'announcements' && <AnnouncementsSection />}
            {activeSection === 'files' && <FilesSection />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Members Section Component
const MembersSection = () => {
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSociety, setSelectedSociety] = useState('');

  const societies = [
    { name: 'Embalenhle', key: 'embalenhle' },
    { name: 'Secunda', key: 'secunda' },
    { name: 'Evander', key: 'evander' },
    { name: 'KMT', key: 'kmt' },
    { name: 'Ebenezer', key: 'ebenezer' },
    { name: 'eMzinoni', key: 'emzinoni' }
  ];

  useEffect(() => {
    fetchMembers();
  }, [selectedSociety, searchTerm]);

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSociety) params.append('society', selectedSociety);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axios.get(`${API}/members?${params}`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Members Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? 'Cancel' : 'Add New Member'}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={selectedSociety}
          onChange={(e) => setSelectedSociety(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Societies</option>
          {societies.map((society) => (
            <option key={society.key} value={society.key}>
              {society.name}
            </option>
          ))}
        </select>
      </div>

      {showForm && <MemberForm onSave={() => { setShowForm(false); fetchMembers(); }} />}

      {/* Members List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Society
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Occupation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.title} {member.full_name}
                      </div>
                      <div className="text-sm text-gray-500">{member.email_address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {member.society}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.gender}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.occupation || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Member Form Component
const MemberForm = ({ onSave }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    title: '',
    residential_address: '',
    email_address: '',
    occupation: '',
    society: '',
    class_allocation: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        date_of_birth: new Date(formData.date_of_birth).toISOString()
      };
      await axios.post(`${API}/members`, submitData);
      alert('Member added successfully!');
      onSave();
    } catch (error) {
      alert('Error adding member: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Add New Member</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <input
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        
        <input
          type="text"
          placeholder="Title (Mr, Mrs, Dr, etc.)"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="text"
          placeholder="Residential Address"
          value={formData.residential_address}
          onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <input
          type="email"
          placeholder="Email Address"
          value={formData.email_address}
          onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="text"
          placeholder="Occupation"
          value={formData.occupation}
          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        
        <select
          value={formData.society}
          onChange={(e) => setFormData({ ...formData, society: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Society</option>
          <option value="embalenhle">Embalenhle</option>
          <option value="secunda">Secunda</option>
          <option value="evander">Evander</option>
          <option value="kmt">KMT</option>
          <option value="ebenezer">Ebenezer</option>
          <option value="emzinoni">eMzinoni</option>
        </select>
        
        <input
          type="text"
          placeholder="Class Allocation"
          value={formData.class_allocation}
          onChange={(e) => setFormData({ ...formData, class_allocation: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        
        <div className="md:col-span-2">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add Member
          </button>
        </div>
      </form>
    </div>
  );
};

// Finances Section Component
const FinancesSection = ({ societies }) => {
  const [showForm, setShowForm] = useState(false);
  const [entries, setEntries] = useState([]);
  const [selectedSociety, setSelectedSociety] = useState('');

  useEffect(() => {
    fetchFinancialEntries();
  }, [selectedSociety]);

  const fetchFinancialEntries = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSociety) params.append('society', selectedSociety);
      
      const response = await axios.get(`${API}/finances?${params}`);
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching financial entries:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Financial Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Financial Entry'}
        </button>
      </div>

      {/* Society Filter */}
      <div className="mb-6">
        <select
          value={selectedSociety}
          onChange={(e) => setSelectedSociety(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Societies</option>
          {societies.map((society) => (
            <option key={society.key} value={society.key}>
              {society.name}
            </option>
          ))}
        </select>
      </div>

      {showForm && <FinancialForm onSave={() => { setShowForm(false); fetchFinancialEntries(); }} />}

      {/* Financial Entries List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Society
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sunday Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pledges
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Special Effort
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {entry.society}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R{entry.sunday_collection.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R{entry.pledges.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R{entry.special_effort.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    R{entry.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Financial Form Component
const FinancialForm = ({ onSave }) => {
  const [formData, setFormData] = useState({
    society: '',
    date: new Date().toISOString().split('T')[0],
    pledges: 0,
    special_effort: 0,
    sunday_collection: 0,
    circuit_events_collection: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        pledges: parseFloat(formData.pledges),
        special_effort: parseFloat(formData.special_effort),
        sunday_collection: parseFloat(formData.sunday_collection),
        circuit_events_collection: parseFloat(formData.circuit_events_collection)
      };
      await axios.post(`${API}/finances`, submitData);
      alert('Financial entry added successfully!');
      onSave();
    } catch (error) {
      alert('Error adding financial entry: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const total = parseFloat(formData.pledges || 0) + 
                parseFloat(formData.special_effort || 0) + 
                parseFloat(formData.sunday_collection || 0) + 
                parseFloat(formData.circuit_events_collection || 0);

  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Add Financial Entry</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          value={formData.society}
          onChange={(e) => setFormData({ ...formData, society: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Society</option>
          <option value="embalenhle">Embalenhle</option>
          <option value="secunda">Secunda</option>
          <option value="evander">Evander</option>
          <option value="kmt">KMT</option>
          <option value="ebenezer">Ebenezer</option>
          <option value="emzinoni">eMzinoni</option>
        </select>
        
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <input
          type="number"
          step="0.01"
          placeholder="Sunday Collection"
          value={formData.sunday_collection}
          onChange={(e) => setFormData({ ...formData, sunday_collection: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="number"
          step="0.01"
          placeholder="Pledges"
          value={formData.pledges}
          onChange={(e) => setFormData({ ...formData, pledges: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="number"
          step="0.01"
          placeholder="Special Effort"
          value={formData.special_effort}
          onChange={(e) => setFormData({ ...formData, special_effort: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="number"
          step="0.01"
          placeholder="Circuit Events Collection"
          value={formData.circuit_events_collection}
          onChange={(e) => setFormData({ ...formData, circuit_events_collection: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        
        <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
          <p className="text-lg font-semibold text-blue-900">
            Total: R{total.toFixed(2)}
          </p>
        </div>
        
        <div className="md:col-span-2">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Add Financial Entry
          </button>
        </div>
      </form>
    </div>
  );
};

// Organizations Section Component
const OrganizationsSection = ({ organizations }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Organizations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <div key={org.key} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <img 
                src={org.logo} 
                alt={`${org.name} Logo`} 
                className="h-12 w-12 rounded-full object-cover shadow-md mr-4"
              />
              <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
            </div>
            
            <div className="space-y-2">
              <button className="w-full bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 transition-colors">
                View Members
              </button>
              <button className="w-full bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 transition-colors">
                Add Member
              </button>
              <button className="w-full bg-purple-100 text-purple-700 py-2 rounded-lg hover:bg-purple-200 transition-colors">
                Upload Reports
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Announcements Section Component
const AnnouncementsSection = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API}/announcements`);
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Announcements</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Announcement'}
        </button>
      </div>

      {showForm && <AnnouncementForm onSave={() => { setShowForm(false); fetchAnnouncements(); }} />}

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{announcement.title}</h3>
              <span className="text-sm text-gray-500">
                {new Date(announcement.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <p className="text-gray-700 mb-4">{announcement.content}</p>
            
            {announcement.deceased_name && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Funeral Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Deceased:</strong> {announcement.deceased_name}</div>
                  <div><strong>Class Leader:</strong> {announcement.class_leader_name}</div>
                  <div><strong>Death Date:</strong> {announcement.death_date ? new Date(announcement.death_date).toLocaleDateString() : 'N/A'}</div>
                  <div><strong>Burial Location:</strong> {announcement.burial_location}</div>
                  <div><strong>Financial Status:</strong> {announcement.financial_status}</div>
                  <div><strong>Attendance:</strong> {announcement.attendance_record}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Announcement Form Component
const AnnouncementForm = ({ onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    deceased_name: '',
    class_leader_name: '',
    death_date: '',
    burial_location: '',
    financial_status: '',
    attendance_record: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        death_date: formData.death_date ? new Date(formData.death_date).toISOString() : null
      };
      await axios.post(`${API}/announcements`, submitData);
      alert('Announcement created successfully!');
      onSave();
    } catch (error) {
      alert('Error creating announcement: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Create Announcement</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Announcement Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <textarea
          placeholder="Announcement Content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
          required
        />
        
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-4">Funeral Details (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Deceased Name"
              value={formData.deceased_name}
              onChange={(e) => setFormData({ ...formData, deceased_name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="text"
              placeholder="Class Leader Name"
              value={formData.class_leader_name}
              onChange={(e) => setFormData({ ...formData, class_leader_name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="date"
              value={formData.death_date}
              onChange={(e) => setFormData({ ...formData, death_date: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="text"
              placeholder="Burial Location"
              value={formData.burial_location}
              onChange={(e) => setFormData({ ...formData, burial_location: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={formData.financial_status}
              onChange={(e) => setFormData({ ...formData, financial_status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Financial Status</option>
              <option value="Good standing">Good Standing</option>
              <option value="Not good standing">Not Good Standing</option>
            </select>
            
            <select
              value={formData.attendance_record}
              onChange={(e) => setFormData({ ...formData, attendance_record: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Attendance Record</option>
              <option value="Attending classes">Attending Classes</option>
              <option value="Not attending classes">Not Attending Classes</option>
            </select>
          </div>
        </div>
        
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Create Announcement
        </button>
      </form>
    </div>
  );
};

// Files Section Component
const FilesSection = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">File Management</h2>
      
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">File Upload & Management</h3>
        <p className="text-gray-600 mb-6">Upload and manage files for reports, announcements, and documents.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors">
            Upload File
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors">
            View Files
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

// App Content Component
const AppContent = () => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LoginPage />;
};

export default App;