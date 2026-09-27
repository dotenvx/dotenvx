Document
  = _ encrypted:EncryptedDefault? _ entries:((FileBlock / Declaration) _)* {
      return { encrypted: encrypted === true, declarations: entries.map(item => item[0]).filter(item => !item.file), files: entries.map(item => item[0]).filter(item => item.file) };
    }

FileBlock
  = "file" [ \t]+ file:Filename [ \t]+ "do" [ \t]* Comment? Newline _ encrypted:EncryptedDefault? _ declarations:(Declaration _)* "end" [ \t]* Comment? (Newline / !.) {
      return { file, encrypted, declarations: declarations.map(item => item[0]) };
    }

Filename "a quoted filename"
  = '"' value:$([^"\r\n\0]+) '"' { return value; }
  / "'" value:$([^'\r\n\0]+) "'" { return value; }

EncryptedDefault
  = "encrypted" [ \t]+ value:Boolean [ \t]* Comment? (Newline / !.) { return value; }

Declaration
  = "env" [ \t]+ name:Name options:Option* [ \t]* Comment? (Newline / !.) {
      const declaration = { name };
      const seen = new Set();
      for (const option of options) {
        if (seen.has(option.key)) error(`Duplicate Envfile option: ${option.key}`);
        if ((option.key === "optional" && seen.has("required")) ||
            (option.key === "required" && seen.has("optional"))) {
          error("Cannot combine required and optional in an Envfile declaration");
        }
        seen.add(option.key);
        if (option.key === "optional") declaration.required = !option.value;
        else declaration[option.key] = option.value;
      }
      return declaration;
    }

Option
  = [ \t]* "," _ "proxy" [ \t]* ":" _ value:(ProxyOptions / Disabled) { return { key: "proxy", value }; }
  / [ \t]* "," _ "required" [ \t]* ":" _ value:Boolean { return { key: "required", value }; }
  / [ \t]* "," _ "optional" [ \t]* ":" _ value:Boolean { return { key: "optional", value }; }
  / [ \t]* "," _ "encrypted" [ \t]* ":" _ value:Boolean { return { key: "encrypted", value }; }
  / [ \t]* "," _ "type" [ \t]* ":" _ value:Type { return { key: "type", value }; }
  / [ \t]* "," _ "enum" [ \t]* ":" _ value:Enum { return { key: "enum", value }; }
  / [ \t]* "," _ key:("min" / "max") [ \t]* ":" _ value:Integer { return { key, value }; }

Integer "an integer"
  = value:$([+-]? [0-9]+) { return value; }

Enum
  = "[" _ first:EnumValue rest:(_ "," _ value:EnumValue { return value; })* _ ","? _ "]" {
      return [first, ...rest];
    }

EnumValue
  = '"' chars:(Escape / [^"\\\r\n])* '"' { return chars.join(""); }
  / "'" chars:(Escape / [^'\\\r\n])* "'" { return chars.join(""); }
  / Integer

Escape
  = "\\" char:["'\\nrt] {
      return ({ n: "\n", r: "\r", t: "\t" })[char] || char;
    }

Type "a supported type (integer, boolean, port, url, email, or ip)"
  = ('"integer"' / "'integer'") { return "integer"; }
  / ('"boolean"' / "'boolean'") { return "boolean"; }
  / ('"port"' / "'port'") { return "port"; }
  / ('"url"' / "'url'") { return "url"; }
  / ('"email"' / "'email'") { return "email"; }
  / ('"ip"' / "'ip'") { return "ip"; }

Boolean "true or false"
  = "true" { return true; }
  / Disabled

ProxyOptions
  = "{" _ "domain" [ \t]* ":" _ domain:Destination _ ","? _ "}" { return { domain }; }

Disabled
  = "false" { return false; }

Destination "a quoted domain"
  = '"' host:$([A-Za-z0-9.-]+) '"' { return host; }
  / "'" host:$([A-Za-z0-9.-]+) "'" { return host; }

Name "a quoted variable name"
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
