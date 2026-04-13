import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Container } from './Container';
import { Link } from './Link';
import { Heading } from './Heading';
import { Text } from './Text';

interface FooterProps {
  className?: string;
}

export const Footer = ({ className }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('bg-gray-50 border-t border-gray-200 py-16 md:py-24', className)}>
      <Container size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl">T</div>
              <Heading level={4} className="text-blue-600">chasquii</Heading>
            </div>
            <Text variant="muted">
              La plataforma líder en transporte de carga en Perú. Conectamos comerciantes con transportistas de confianza.
            </Text>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>

          <div className="space-y-6">
            <Heading level={5}>Plataforma</Heading>
            <ul className="space-y-4">
              <li><Link to="/como-funciona" variant="default">Cómo funciona</Link></li>
              <li><Link to="/tarifas" variant="default">Tarifas</Link></li>
              <li><Link to="/seguridad" variant="default">Seguridad</Link></li>
              <li><Link to="/ayuda" variant="default">Centro de ayuda</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <Heading level={5}>Compañía</Heading>
            <ul className="space-y-4">
              <li><Link to="/nosotros" variant="default">Sobre nosotros</Link></li>
              <li><Link to="/contacto" variant="default">Contacto</Link></li>
              <li><Link to="/terminos" variant="default">Términos y condiciones</Link></li>
              <li><Link to="/privacidad" variant="default">Política de privacidad</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <Heading level={5}>Contacto</Heading>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-sm text-gray-500">
                <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
                <span>Av. Javier Prado Este 1234, San Isidro, Lima, Perú</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-gray-500">
                <Phone className="h-5 w-5 text-blue-600 shrink-0" />
                <span>+51 1 234 5678</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-gray-500">
                <Mail className="h-5 w-5 text-blue-600 shrink-0" />
                <span>contacto@chasquii.pe</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <Text variant="small">
            © {currentYear} chasquii. Todos los derechos reservados.
          </Text>
          <div className="flex items-center space-x-6">
            <Link to="/terminos" variant="default" className="text-xs">Términos</Link>
            <Link to="/privacidad" variant="default" className="text-xs">Privacidad</Link>
            <Link to="/cookies" variant="default" className="text-xs">Cookies</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
};
