import { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonSegment,
  IonSegmentButton, IonSelect, IonSelectOption, IonText, IonLoading,
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../lib/errorMessages';

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
    navigate('/home');
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !data.user) {
      setLoading(false);
      setError(getFriendlyErrorMessage(signUpError ?? new Error('No se pudo crear la cuenta')));
      return;
    }

    // Creamos la fila en "profiles" que extiende auth.users con nuestros datos propios
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      role,
      full_name: fullName,
    });

    setLoading(false);

    if (profileError) {
      setError(getFriendlyErrorMessage(profileError));
      return;
    }

    navigate('/home');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
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
            <IonItem>
              <IonLabel position="stacked">Nombre completo</IonLabel>
              <IonInput value={fullName} onIonInput={(e) => setFullName(e.detail.value!)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Tipo de cuenta</IonLabel>
              <IonSelect value={role} onIonChange={(e) => setRole(e.detail.value)}>
                <IonSelectOption value="cliente">Cliente</IonSelectOption>
                <IonSelectOption value="profesional">Profesional</IonSelectOption>
              </IonSelect>
            </IonItem>
          </>
        )}

        <IonItem>
          <IonLabel position="stacked">Correo</IonLabel>
          <IonInput type="email" value={email} onIonInput={(e) => setEmail(e.detail.value!)} />
        </IonItem>
        <IonItem>
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
          onClick={mode === 'login' ? handleLogin : handleSignup}
        >
          {mode === 'login' ? 'Entrar' : 'Registrarme'}
        </IonButton>

        <IonLoading isOpen={loading} message="Un momento..." />
      </IonContent>
    </IonPage>
  );
};

export default Login;