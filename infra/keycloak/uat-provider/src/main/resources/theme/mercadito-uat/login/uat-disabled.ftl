<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=true displayInfo=false; section>
  <#if section == "header">Acceso UAT en preparación
  <#elseif section == "form">
    <p>Estamos preparando la verificación de estudiantes UAT. Todavía no se reciben credenciales del portal.</p>
    <p><a href="https://mercadito.291006.xyz/ingresar">Volver a Mercadito</a></p>
  </#if>
</@layout.registrationLayout>
