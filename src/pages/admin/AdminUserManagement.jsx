import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { reservationsAPI } from '../../utils/api';
import Modal from '../../components/ui/Modal';
import styles from '../../styles/AdminReservations.module.css';