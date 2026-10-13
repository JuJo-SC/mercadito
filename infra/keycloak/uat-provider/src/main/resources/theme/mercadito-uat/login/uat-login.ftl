<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=true displayInfo=false; section>
  <#if section == "header">
    Accede con tu cuenta UAT
  <#elseif section == "form">
    <p>Usa tu matrícula o correo de alumnos UAT y la contraseña del portal. Mercadito verifica tu acceso y situación académica sin guardar la contraseña.</p>
    <form id="kc-form-login" action="${url.loginAction}" method="post">
      <div class="pf-v5-c-form__group">
        <label class="pf-v5-c-form__label" for="username"><span class="pf-v5-c-form__label-text">Matrícula o correo UAT</span></label>
        <input class="pf-v5-c-form-control" id="username" name="username" type="text" maxlength="254" autocomplete="username" autofocus required />
      </div>
      <div class="pf-v5-c-form__group">
        <label class="pf-v5-c-form__label" for="password"><span class="pf-v5-c-form__label-text">Contraseña del portal UAT</span></label>
        <input class="pf-v5-c-form-control" id="password" name="password" type="password" maxlength="512" autocomplete="current-password" required />
      </div>
      <p>Solo se consulta la información necesaria para verificar que eres estudiante activo; no se solicitan horarios ni calificaciones.</p>
      <p>
        <label><input name="verificationConsent" type="checkbox" value="yes" required />
        Acepto que Mercadito use estas credenciales únicamente para validar mi matrícula y situación académica con el portal UAT, sin guardar mi contraseña ni consultar horarios o calificaciones.</label>
        <#if uatPrivacyUrl??><a href="${uatPrivacyUrl}" target="_blank" rel="noopener noreferrer">Leer el aviso de privacidad</a></#if>
      </p>
      <button class="pf-v5-c-button pf-m-primary pf-m-block" type="submit">Verificar y entrar</button>
    </form>
    <p><a href="https://mercadito.291006.xyz/ingresar">Volver a Mercadito</a></p>
  </#if>
</@layout.registrationLayout>
