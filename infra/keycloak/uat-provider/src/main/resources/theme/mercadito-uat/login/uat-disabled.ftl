<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=true displayInfo=false; section>
  <#if section == "header">Acceso UAT en preparación
  <#elseif section == "form">
    <p class="uat-lead">Estamos preparando la verificación de estudiantes UAT. Todavía no se reciben credenciales del portal.</p>
    <p class="uat-back"><a href="https://mercadito.291006.xyz/ingresar"><i class="fas fa-arrow-left" aria-hidden="true"></i>Volver a Mercadito</a></p>
  </#if>
</@layout.registrationLayout>
