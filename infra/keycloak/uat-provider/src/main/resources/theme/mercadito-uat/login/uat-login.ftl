<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=true displayInfo=false; section>
  <#if section == "header">
    Accede con tu cuenta UAT
  <#elseif section == "form">
    <p class="uat-lead">Usa tu matrícula o correo de alumnos UAT y la contraseña del portal. Mercadito verifica tu acceso y situación académica sin guardar la contraseña.</p>
    <form id="kc-form-login" class="pf-v5-c-form pf-v5-u-w-100" action="${url.loginAction}" method="post">
      <div class="pf-v5-c-form__group">
        <div class="pf-v5-c-form__group-label pf-v5-u-pb-xs">
          <label class="pf-v5-c-form__label" for="username"><span class="pf-v5-c-form__label-text">Matrícula o correo UAT</span></label>
        </div>
        <input class="pf-v5-c-form-control" id="username" name="username" type="text" maxlength="254" autocomplete="username" autocapitalize="none" spellcheck="false" autofocus required />
      </div>
      <div class="pf-v5-c-form__group">
        <div class="pf-v5-c-form__group-label pf-v5-u-pb-xs">
          <label class="pf-v5-c-form__label" for="password"><span class="pf-v5-c-form__label-text">Contraseña del portal UAT</span></label>
        </div>
        <div class="pf-v5-c-input-group">
          <div class="pf-v5-c-input-group__item pf-m-fill">
            <span class="pf-v5-c-form-control">
              <input id="password" name="password" type="password" maxlength="512" autocomplete="current-password" required />
            </span>
          </div>
          <div class="pf-v5-c-input-group__item">
            <button class="pf-v5-c-button pf-m-control" type="button" aria-label="${msg("showPassword")}"
                    aria-controls="password" data-password-toggle
                    data-icon-show="fa-eye fas" data-icon-hide="fa-eye-slash fas"
                    data-label-show="${msg("showPassword")}" data-label-hide="${msg("hidePassword")}" id="password-show-password">
              <i class="fa-eye fas" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="uat-privacy" role="note">
        <i class="fas fa-shield-alt" aria-hidden="true"></i>
        <p>Solo se consulta la información necesaria para verificar que eres estudiante activo; no se solicitan horarios ni calificaciones.</p>
      </div>
      <div class="uat-consent">
        <label class="uat-consent-label"><input name="verificationConsent" type="checkbox" value="yes" required />
        <span>Acepto que Mercadito use estas credenciales únicamente para validar mi matrícula y situación académica con el portal UAT, sin guardar mi contraseña ni consultar horarios o calificaciones.</span></label>
        <#if uatPrivacyUrl??><a href="${uatPrivacyUrl}" target="_blank" rel="noopener noreferrer">Leer el aviso de privacidad</a></#if>
      </div>
      <button class="pf-v5-c-button pf-m-primary pf-m-block" type="submit">Verificar y entrar</button>
    </form>
    <p class="uat-back"><a href="https://mercadito.291006.xyz/ingresar"><i class="fas fa-arrow-left" aria-hidden="true"></i>Volver a Mercadito</a></p>
  </#if>
</@layout.registrationLayout>
