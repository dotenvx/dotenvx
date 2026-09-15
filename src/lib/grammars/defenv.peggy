Document
  = _ declarations:(Declaration _)* { return declarations.map(item => item[0]); }

Declaration
  = "env" [ \t]+ name:Name gateway:Gateway? [ \t]* Comment? (Newline / !.) {
      return { name, gateway: gateway === true };
    }

Gateway
  = [ \t]* "," [ \t]* "gateway" [ \t]* ":" [ \t]* value:Boolean { return value; }

Boolean
  = "true" { return true; }
  / "false" { return false; }

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
