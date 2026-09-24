import { IonAvatar } from '@ionic/react';

interface ProfessionalAvatarProps {
  fullName: string | null | undefined;
  isVerified: boolean;
  className?: string;
}

const ProfessionalAvatar: React.FC<ProfessionalAvatarProps> = ({ fullName, isVerified, className }) => (
  <IonAvatar className={`app-avatar${isVerified ? ' app-avatar--verified' : ''}${className ? ` ${className}` : ''}`}>
    <img
      src={`https://api.dicebear.com/7.x/initials/svg?seed=${fullName ?? '?'}`}
      alt={fullName ?? 'Profesional'}
    />
  </IonAvatar>
);

export default ProfessionalAvatar;
