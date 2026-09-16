Document
  = _ declarations:(Declaration _)* { return declarations.map(item => item[0]); }

Declaration
  = "env" [ \t]+ name:Name options:Option* [ \t]* Comment? (Newline / !.) {
      const declaration = { name, proxy: false, required: true };
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
  / [ \t]* "," _ "type" [ \t]* ":" _ value:Type { return { key: "type", value }; }
  / [ \t]* "," _ "enum" [ \t]* ":" _ value:Enum { return { key: "enum", value }; }
  / [ \t]* "," _ key:("min" / "max") [ \t]* ":" _ value:Integer { return { key, value }; }

Integer
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

Type
  = ('"integer"' / "'integer'") { return "integer"; }
  / ('"boolean"' / "'boolean'") { return "boolean"; }

Boolean
  = "true" { return true; }
  / Disabled

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
