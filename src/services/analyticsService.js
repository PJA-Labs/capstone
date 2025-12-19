import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class AnalyticsService {
  // Get room analytics data
  async getRoomAnalytics(period = 30) {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/rooms`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching room analytics:', error);
      throw error;
    }
  }

  // Get zoom analytics data
  async getZoomAnalytics(period = 30) {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/zoom`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching zoom analytics:', error);
      throw error;
    }
  }

  // Get dashboard analytics data
  async getDashboardAnalytics(period = 30) {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/dashboard`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();