# Relatório Técnico de Segurança: Tipagem e Integridade de Dados
## 1. A Importância de Tipos Explícitos em Requisições API
O uso de tipagem estrita no TypeScript (evitando o any) é a primeira linha de defesa no desenvolvimento seguro de software. Embora o TypeScript seja transpilado para JavaScript (perdendo os tipos em tempo de execução), a definição de tipos durante o desenvolvimento oferece camadas vitais de segurança:

- Previsibilidade de Contrato: Ao definir que uma função recebe (orgaoId: number), você garante que o desenvolvedor não passe acidentalmente um objeto ou uma string mal formatada. Isso reduz bugs lógicos que podem abrir brechas de segurança.

- Sanitização Indireta: Forçar um tipo ajuda a garantir que os dados trafeguem no formato esperado antes mesmo de chegarem ao banco de dados.

- Manutenibilidade Segura: Em equipes, tipos explícitos funcionam como documentação viva. Se alguém tentar alterar a estrutura do dado de uma forma que quebraria a segurança ou a lógica, o compilador bloqueará o erro imediatamente.

- Nota de Segurança: O TypeScript valida em tempo de compilação. Para segurança total em APIs, recomenda-se usar bibliotecas de validação de esquema (como Zod ou Joi) para garantir que os dados vindos do frontend (tempo de execução) realmente correspondem aos tipos definidos.

## 2. A Proteção contra SQL Injection (?):

- Note o ponto de interrogação na query: WHERE orgao_id = ?.

- Isso se chama Prepared Statement (ou consulta parametrizada).

- Por que é seguro? O banco de dados trata o comando SQL (SELECT...) separadamente do dado (orgaoId). Se um hacker tentar enviar um código malicioso no lugar do ID (como 1 OR 1=1), o banco de dados vai tratar aquilo estritamente como um texto literal, e não como um comando executável. O ? é o "escudo" do seu código.

- Nota de Segurança: Sempre que possível, use Prepared Statements ao invés de concatenação de strings para montar queries SQL.

```typescript
export const getTamanhoFolha = async (orgaoId) => {
    try {
        const row = await dbAsync.get('SELECT tamanho_folha FROM organogramas_estruturais WHERE orgao_id = ?', [orgaoId]); // <--------- aqui é onde acontece a mágica
        return row ? row.tamanho_folha : 'A4';
    } catch (error) {
        console.error('Erro ao buscar tamanho da folha:', error);
        return 'A4';
    }
};
```

[Link para leitura sobre o tema](https://medium.com/@kittikawin_ball/full-stack-security-101-common-mistakes-and-how-to-avoid-them-4fc7ca80d81d)

[Mais um](https://impalaintech.com/blog/risks-of-ai-software-development/#:~:text=2.,authentication%20mechanisms%20and%20authorization%20controls)

[Neste Site](https://www.hirefullstackdeveloperindia.com/the-growing-importance-of-cybersecurity-in-full-stack-development)

## Diz que:
### 3. Common Cybersecurity Risks in Full-Stack Development

Let’s talk about how hackers usually get in. Here are some common traps that developers fall into:

- Cross-Site Scripting (XSS): This happens when someone sneaks in malicious code on your website. If a hacker tricks your app into displaying this code, it could steal user info or redirect them to dangerous sites. Always clean up user input!

- SQL Injection: This is when a hacker inserts harmful SQL code into your database through a user input field, like a login form. With this, they can access or delete data. Scary, right? The fix? Use prepared statements and sanitize inputs.

- Cross-Site Request Forgery (CSRF): This attack tricks a user into doing something they didn’t intend to, like transferring money or changing account settings. CSRF tokens can help prevent this.

- Weak APIs: APIs let apps talk to each other, but if they’re not secure, hackers can sneak in. Always authenticate API calls and never expose sensitive data.

- Poor Authentication: Weak passwords, no two-factor authentication, and improper user access can let attackers easily break in. Always use strong, secure authentication methods.

## e depois complementa com as medidas de segurança:

### 4. Best Practices for Ensuring Cybersecurity in Full-Stack Development
Now that you know the risks, how can you protect your apps? Let’s break it down:

- Use HTTPS Everywhere: HTTPS encrypts data between the user and your app. It’s like sending a locked letter instead of a postcard. Always use it!

- Validate and Sanitize Inputs: Never trust user input. Clean it up before using it in your code. This stops XSS and SQL injection attacks.

- Strong Authentication: Use strong passwords and implement multi-factor authentication (MFA). Password managers and OAuth are great tools.

- Keep Everything Updated: Outdated software is a hacker’s best friend. Regularly update your frameworks, libraries, and tools.

- Secure APIs: Use authentication (like OAuth), encrypt sensitive data, and limit API access to what’s necessary.

- Role-Based Access Control (RBAC): Not every user needs admin rights. Limit what users can do based on their role.

- Encrypt Sensitive Data: Store passwords and personal data in encrypted form. Use hashing algorithms like bcrypt for passwords.

## E por fim, ele conclui dizendo qual nosso papel:

### 5. The Role of Full-Stack Developers in Cybersecurity
Here’s the truth: as a full-stack developer, you are the first line of defense.

- Think Security from the Start: Don’t wait until the end to “add security.” Build it into every stage of your project.
- Keep Learning: Cyber threats are always changing. Stay updated with security blogs, forums, and online courses.
- Collaborate with Security Experts: Don’t be afraid to ask for help. Security specialists can catch things you might miss.
- Your job isn’t just to make things work—it’s to make them safe. 

Note: Companies aiming for secure and high-performing apps should Hire full-stack developers from a professional full-stack development company with proven cybersecurity expertise