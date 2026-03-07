import React from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-black text-white mt-4 border-t border-gray-800 dark:border-gray-950 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-4">Nos Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-primary transition cursor-pointer">
                Livraison à domicile
              </li>
              <li className="hover:text-primary transition cursor-pointer">
                Super-marchés
              </li>
              <li className="hover:text-primary transition cursor-pointer">
                Entreprises
              </li>
              <li className="hover:text-primary transition cursor-pointer">
                Particuliers
              </li>
              <li className="hover:text-primary transition cursor-pointer">
                <Link to="/about">À propos de nous</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contactez-nous</h3>
            <div className="space-y-3 text-gray-400">
              <Link
                to="/contact"
                className="block hover:text-primary transition"
              >
                Formulaire de contact
              </Link>
              <div className="flex items-center space-x-2 hover:text-primary transition cursor-pointer">
                <Phone size={18} />
                <a href="tel:+224610850029">610 85 00 29</a>
              </div>
              <div className="flex items-center space-x-2 hover:text-primary transition cursor-pointer">
                <Mail size={18} />
                <a href="mailto:augustinkolie54@gmail.com">augustinkolie54@gmail.com</a>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={18} />
                <span>La grande ville de Zaly</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-lg font-bold mb-4">Nos Horaires</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Lundi - Samedi: 10h - 21h</li>
              <li>Dimanche: 9h - 23h</li>
              <li className="text-primary font-semibold mt-4">Ouvert maintenant</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-bold mb-4">Nos Réseaux</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Instagram size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Twitter size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Youtube size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 dark:border-gray-800 mt-8 pt-8 text-center text-gray-400 dark:text-gray-500">
          <p>&copy; 2025 CuniResto KOLIE 3.0 | Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
