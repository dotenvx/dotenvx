Document
  = _ declarations:(Declaration _)* { return declarations.map(item => item[0]); }

Declaration
  = "env" [ \t]+ name:Name proxy:Proxy? [ \t]* Comment? (Newline / !.) {
      return { name, proxy: proxy || false };
    }

Proxy
  = [ \t]* "," _ "proxy" [ \t]* ":" _ value:(ProxyOptions / Disabled) { return value; }

ProxyOptions
  = "{" _ "domain" [ \t]* ":" _ domain:Destination _ ","? _ "}" { return { domain }; }

Disabled
  = "false" { return false; }

Destination
  = '"' host:$([A-Za-z0-9.-]+) '"' { return host; }
  / "'" host:$([A-Za-z0-9.-]+) "'" { return host; }

Name
  = '"' name:Identifier '"' { return name; }
  / "'" name:Identifier "'" { return name; }

Identifier
  = $([A-Za-z_] [A-Za-z0-9_]*)

Comment
  = "#" [^\r\n]*

Newline
  = "\r\n" / "\n" / "\r"

_
  = ([ \t] / Newline / Comment)*
