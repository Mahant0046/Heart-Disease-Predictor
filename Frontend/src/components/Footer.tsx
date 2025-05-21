import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailInput = document.getElementById('newsletter-email') as HTMLInputElement;
    if (emailInput.value) {
      // Create notification container if it doesn't exist
      let notificationContainer = document.getElementById('notification-container');
      if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'fixed top-4 right-4 z-50';
        document.body.appendChild(notificationContainer);
      }

      // Create and show notification
      const notification = document.createElement('div');
      notification.className = 'bg-white text-gray-800 px-6 py-4 rounded-lg shadow-lg border-l-4 border-green-500 transform transition-all duration-300 mb-4';
      notification.innerHTML = `
        <div class="flex items-center">
          <i class="fas fa-check-circle text-green-500 text-xl mr-3"></i>
          <div>
            <h4 class="font-semibold">Subscription Confirmed!</h4>
            <p class="text-sm text-gray-600">Thank you for subscribing to our newsletter. You'll receive regular updates about heart health.</p>
          </div>
        </div>
      `;

      notificationContainer.appendChild(notification);

      // Remove notification after 5 seconds
      setTimeout(() => {
        notification.classList.add('opacity-0');
        setTimeout(() => {
          if (notificationContainer && notificationContainer.contains(notification)) {
            notificationContainer.removeChild(notification);
          }
        }, 300);
      }, 5000);

      // Clear input
      emailInput.value = '';
    }
  };

  return (
    <footer className="bg-gradient-to-b from-gray-800 to-gray-900 text-white py-12 font-libre-franklin">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <i className="fas fa-heartbeat text-red-500 text-2xl mr-2"></i>
              <h3 className="text-xl font-bold">Heart Disease Prediction System</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Advanced machine learning for heart health risk assessment and personalized recommendations.
            </p>
            <div className="flex space-x-4">
              <Link to="/social/facebook" className="text-gray-400 hover:text-white transition-colors duration-200">
                <i className="fab fa-facebook-f text-lg"></i>
              </Link>
              <Link to="/social/twitter" className="text-gray-400 hover:text-white transition-colors duration-200">
                <i className="fab fa-twitter text-lg"></i>
              </Link>
              <Link to="/social/instagram" className="text-gray-400 hover:text-white transition-colors duration-200">
                <i className="fab fa-instagram text-lg"></i>
              </Link>
              <Link to="/social/linkedin" className="text-gray-400 hover:text-white transition-colors duration-200">
                <i className="fab fa-linkedin-in text-lg"></i>
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors duration-200">Home</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors duration-200">About Us</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-white transition-colors duration-200">Services</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors duration-200">Contact</Link></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors duration-200">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mt-1 mr-2 text-red-500"></i>
                <span className="text-gray-400">123 Health Avenue, Medical District, NY 10001</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone-alt mr-2 text-red-500"></i>
                <span className="text-gray-400">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope mr-2 text-red-500"></i>
                <span className="text-gray-400">info@heartprediction.com</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Newsletter</h4>
            <p className="text-gray-400 mb-4">Subscribe to our newsletter for the latest updates on heart health.</p>
            <form className="flex" onSubmit={handleNewsletterSubmit}>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Your email address"
                className="px-4 py-2 w-full rounded-l-lg text-gray-800 border-none focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 rounded-r-lg transition-all duration-300 hover:shadow-lg"
              >
                <i className="fas fa-paper-plane transform transition-transform hover:translate-x-1"></i>
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 Heart Disease Prediction System. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <p className="text-gray-400 text-sm">
              <strong className="text-red-500">Disclaimer:</strong> This system provides risk assessment only and should not replace professional medical advice.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 