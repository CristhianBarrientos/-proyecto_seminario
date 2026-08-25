import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonBadge, IonText, IonToggle,
} from '@ionic/react';
import { logOutOutline, moonOutline, sunnyOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../lib/errorMessages';

interface ProfileData {
  full_name: string;
  role: 'cliente' | 'profesional';
}

const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError(getFriendlyErrorMessage(error));
          return;
        }
        setProfile(data);
      });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Mi perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        <IonList>
          <IonItem>
            <IonLabel>
              <h2>{profile?.full_name ?? 'Cargando...'}</h2>
              <p>{user?.email}</p>
            </IonLabel>
            {profile?.role && (
              <IonBadge color={profile.role === 'profesional' ? 'tertiary' : 'medium'} slot="end">
                {profile.role === 'profesional' ? 'Profesional' : 'Cliente'}
              </IonBadge>
            )}
          </IonItem>

          <IonItem>
            <IonIcon icon={isDark ? moonOutline : sunnyOutline} slot="start" />
            <IonLabel>Modo noche</IonLabel>
            <IonToggle checked={isDark} onIonChange={toggleTheme} slot="end" />
          </IonItem>
        </IonList>

        {profile?.role === 'profesional' && (
          <>
            <IonButton expand="block" className="ion-margin-top" onClick={() => navigate('/tabs/profile/edit')}>
              Editar perfil profesional
            </IonButton>
            <IonButton expand="block" onClick={() => navigate('/tabs/profile/services')}>
              Mis servicios
            </IonButton>
          </>
        )}

        <IonButton expand="block" color="danger" className="ion-margin-top" onClick={handleSignOut}>
          <IonIcon icon={logOutOutline} slot="start" />
          Cerrar sesión
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Profile;