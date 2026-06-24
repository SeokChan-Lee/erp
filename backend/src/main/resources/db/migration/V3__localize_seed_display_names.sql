update employees
set display_name = '시스템 관리자'
where employee_no = 'A-0001';

update employees
set display_name = '운영 담당자'
where employee_no = 'E-0001';

update app_users
set display_name = '시스템 관리자'
where username = 'admin';

update app_users
set display_name = '운영 담당자'
where username = 'employee';
