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
import { isValidEmail, isValidFullName, MIN_PASSWORD_LENGTH } from '../lib/validation';
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
  const [touched, setTouched] = useState(false);

  const emailInvalid = touched && !isValidEmail(email);
  const passwordInvalid = touched && password.trim().length < MIN_PASSWORD_LENGTH;
  const fullNameInvalid = touched && mode === 'signup' && !isValidFullName(fullName);

  const fieldClass = (invalid: boolean) => `app-field${invalid ? ' app-field--invalid' : ''}`;

  // Los mensajes puntuales ya se muestran debajo de cada campo (fullNameInvalid,
  // emailInvalid, passwordInvalid) - acá solo decidimos si hay algo que bloquee el envío.
  const isValid = (): boolean => {
    if (mode === 'signup' && !isValidFullName(fullName)) return false;
    if (!isValidEmail(email)) return false;
    if (password.trim().length < MIN_PASSWORD_LENGTH) return false;
    return true;
  };

  const handleLogin = async () => {
    setTouched(true);
    if (!isValid()) {
      setError('Revisá los campos marcados antes de continuar.');
      return;
    }

    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setError(getFriendlyErrorMessage(error));
      return;
    }
    navigate('/tabs/home');
  };

  const handleSignup = async () => {
    setTouched(true);
    if (!isValid()) {
      setError('Revisá los campos marcados antes de continuar.');
      return;
    }

    setLoading(true);
    setError('');

    // La fila en "profiles" la crea un trigger en la misma transacción
    // del signup (ver sql_docker/fix-signup-orfano.sql) - full_name/role
    // van como metadata, no como insert separado, para que no pueda
    // quedar un usuario en auth.users sin su fila en profiles.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), role } },
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
          <IonSegment
            value={mode}
            onIonChange={(e) => {
              setMode(e.detail.value as 'login' | 'signup');
              setError('');
              setTouched(false);
            }}
          >
            <IonSegmentButton value="login">
              <IonLabel>Iniciar sesión</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="signup">
              <IonLabel>Crear cuenta</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {mode === 'signup' && (
            <>
              <IonItem className={fieldClass(fullNameInvalid)}>
                <IonIcon icon={personOutline} slot="start" color="medium" />
                <IonLabel position="stacked">Nombre completo *</IonLabel>
                <IonInput value={fullName} placeholder="Ej. María López" onIonInput={(e) => setFullName(e.detail.value!)} />
              </IonItem>
              {fullNameInvalid && (
                <IonText color="danger">
                  <p className="field-error">Ingresá tu nombre y apellido (solo letras, sin números).</p>
                </IonText>
              )}
              <IonItem className="app-field">
                <IonIcon icon={briefcaseOutline} slot="start" color="medium" />
                <IonLabel position="stacked">Tipo de cuenta *</IonLabel>
                <IonSelect value={role} onIonChange={(e) => setRole(e.detail.value)}>
                  <IonSelectOption value="cliente">Cliente</IonSelectOption>
                  <IonSelectOption value="profesional">Profesional</IonSelectOption>
                </IonSelect>
              </IonItem>
            </>
          )}

          <IonItem className={fieldClass(emailInvalid)}>
            <IonIcon icon={mailOutline} slot="start" color="medium" />
            <IonLabel position="stacked">Correo *</IonLabel>
            <IonInput type="email" value={email} onIonInput={(e) => setEmail(e.detail.value!)} />
          </IonItem>
          {emailInvalid && (
            <IonText color="danger"><p className="field-error">Ingresá un correo válido.</p></IonText>
          )}

          <IonItem className={fieldClass(passwordInvalid)}>
            <IonIcon icon={lockClosedOutline} slot="start" color="medium" />
            <IonLabel position="stacked">Contraseña *</IonLabel>
            <IonInput type="password" value={password} onIonInput={(e) => setPassword(e.detail.value!)} />
          </IonItem>
          {passwordInvalid && (
            <IonText color="danger">
              <p className="field-error">La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres.</p>
            </IonText>
          )}

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
