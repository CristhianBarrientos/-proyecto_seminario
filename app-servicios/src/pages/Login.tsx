import { useState } from 'react';
import {
  IonPage, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonSegment,
  IonSegmentButton, IonSelect, IonSelectOption, IonText, IonLoading, IonIcon,
} from '@ionic/react';
import { hammerOutline, mailOutline, lockClosedOutline, personOutline, briefcaseOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../lib/errorMessages';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'cliente' | 'profesional'>('cliente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }
    navigate('/tabs/home');
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');

    // La fila en "profiles" la crea un trigger en la misma transacción
    // del signup (ver sql_docker/fix-signup-orfano.sql) - full_name/role
    // van como metadata, no como insert separado, para que no pueda
    // quedar un usuario en auth.users sin su fila en profiles.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });

    setLoading(false);

    if (signUpError || !data.user) {
      setError(getFriendlyErrorMessage(signUpError ?? new Error('No se pudo crear la cuenta')));
      return;
    }

    navigate('/tabs/home');
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-content">
        <div className="login-hero app-hero">
          <div className="app-hero-icon">
            <IonIcon icon={hammerOutline} />
          </div>
          <h1 className="login-hero__title">Oficios cerca de ti</h1>
          <p className="login-hero__subtitle">
            Encontrá o publicá servicios de electricidad, plomería, albañilería y más.
          </p>
        </div>

        <div className="login-form">
          <IonSegment value={mode} onIonChange={(e) => setMode(e.detail.value as 'login' | 'signup')}>
            <IonSegmentButton value="login">
              <IonLabel>Iniciar sesión</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="signup">
              <IonLabel>Crear cuenta</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {mode === 'signup' && (
            <>
              <IonItem className="app-field">
                <IonIcon icon={personOutline} slot="start" color="medium" />
                <IonLabel position="stacked">Nombre completo</IonLabel>
                <IonInput value={fullName} onIonInput={(e) => setFullName(e.detail.value!)} />
              </IonItem>
              <IonItem className="app-field">
                <IonIcon icon={briefcaseOutline} slot="start" color="medium" />
                <IonLabel position="stacked">Tipo de cuenta</IonLabel>
                <IonSelect value={role} onIonChange={(e) => setRole(e.detail.value)}>
                  <IonSelectOption value="cliente">Cliente</IonSelectOption>
                  <IonSelectOption value="profesional">Profesional</IonSelectOption>
                </IonSelect>
              </IonItem>
            </>
          )}

          <IonItem className="app-field">
            <IonIcon icon={mailOutline} slot="start" color="medium" />
            <IonLabel position="stacked">Correo</IonLabel>
            <IonInput type="email" value={email} onIonInput={(e) => setEmail(e.detail.value!)} />
          </IonItem>
          <IonItem className="app-field">
            <IonIcon icon={lockClosedOutline} slot="start" color="medium" />
            <IonLabel position="stacked">Contraseña</IonLabel>
            <IonInput type="password" value={password} onIonInput={(e) => setPassword(e.detail.value!)} />
          </IonItem>

          {error && (
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          )}

          <IonButton
            expand="block"
            className="ion-margin-top"
            color="secondary"
            onClick={mode === 'login' ? handleLogin : handleSignup}
          >
            {mode === 'login' ? 'Entrar' : 'Registrarme'}
          </IonButton>
        </div>

        <IonLoading isOpen={loading} message="Un momento..." />
      </IonContent>
    </IonPage>
  );
};

export default Login;
