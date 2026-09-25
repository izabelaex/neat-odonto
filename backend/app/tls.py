"""Validação HTTPS com as autoridades confiáveis do sistema operacional."""
import ssl

import truststore

tls_context = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
